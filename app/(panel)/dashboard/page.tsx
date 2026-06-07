'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import {
  Key, CheckCircle, Clock, XCircle, User, Shield, DollarSign,
  TrendingUp, KeyRound, History, Activity, Gamepad2, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import ExpiryNotificationBanner from '@/components/dashboard/ExpiryNotificationBanner';
import Announcements from '@/components/dashboard/Announcements';
import FtpStats from '@/components/dashboard/FtpStats';
import LibDownloadLogs from '@/components/dashboard/LibDownloadLogs';

interface DashboardAnalytics {
  keyStats: { total: number; active: number; expired: number; blocked: number; unused: number };
  keyTrends: { date: string; count: number }[];
  gameDistribution: { game: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  userLevelDistribution: { owners: number; admins: number; resellers: number };
  recentActivity: { date: string; created: number; expired: number }[];
  topPerformers: { username: string; fullname: string; keysUsed: number; totalKeys: number; rank: number }[];
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'rgba(9, 19, 24, 0.98)',
  border: '1px solid rgba(20, 184, 184, 0.4)',
  borderRadius: '10px',
  fontSize: 12,
  color: '#e8f8f8',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
};

const BAR_COLORS = ['#14b8b8', '#5eead4', '#39ff14', '#00fff7', '#a78bfa', '#f0c040', '#60a5fa', '#f87171'];

const PIE_COLORS: Record<string, string> = {
  active: '#39ff14',
  expired: '#f0c040',
  blocked: '#ef4444',
  unused: '#6b7280',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ fontFamily: 'var(--ff-mono)', fontSize: '0.78rem', letterSpacing: '0.06em', color: 'var(--text-lo)' }}>
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const stats = analytics?.keyStats;
  const active = stats?.active ?? 0;
  const total = stats?.total ?? 0;
  const expired = stats?.expired ?? 0;
  const blocked = stats?.blocked ?? 0;
  const usageRate = total > 0 ? Math.round((active / total) * 100) : 0;

  const level = user?.level ?? 3;
  const levelLabel = level === 1 ? 'Owner' : level === 2 ? 'Admin' : 'Reseller';

  return (
    <div className="space-y-6">
      <ExpiryNotificationBanner />
      <Announcements />

      {/* Welcome Banner */}
      <section className="welcome-banner fade-up">
        <div className="banner-accent" />
        <div className="welcome-left">
          <div className="welcome-greeting">
            {greeting} · {levelLabel}
            <span style={{ color: 'var(--text-lo)' }}>· {new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="welcome-name">
            Welcome back, <span className="highlight">{user?.fullname || user?.username || 'Operator'}</span>
          </h1>
          <p className="welcome-sub">
            Your command centre is live. All systems operational — manage your keys, monitor activity, and watch your store dominate.
          </p>
          <div className="welcome-actions">
            <Link href="/keys/generate" className="btn-primary">
              <KeyRound size={14} />
              <span>Generate Keys</span>
            </Link>
            <Link href="/keys" className="btn-outline">
              <History size={14} />
              <span>View Keys</span>
            </Link>
          </div>
        </div>

        <div className="welcome-metrics">
          <div className="metric-pill">
            <span className="metric-val cyan">{active.toLocaleString()}</span>
            <span className="metric-lbl">Active</span>
          </div>
          <div className="metric-pill">
            <span className="metric-val green">{usageRate}%</span>
            <span className="metric-lbl">Usage</span>
          </div>
          <div className="metric-pill">
            <span className="metric-val gold">${user?.saldo?.toFixed(2) ?? '0.00'}</span>
            <span className="metric-lbl">Saldo</span>
          </div>
        </div>
      </section>

      {/* Stat row */}
      <div className="stat-row fade-up d1" style={{ marginBottom: 0 }}>
        <StatCard accent="var(--teal-2)" icon={<Key size={20} />} value={total} label="Total Keys" delta="Issued" deltaIcon={<Key size={10} />} deltaColor="var(--teal-2)" />
        <StatCard accent="var(--ecto-green)" icon={<CheckCircle size={20} />} value={active} label="Active" delta="Running" deltaIcon={<TrendingUp size={10} />} deltaColor="var(--ecto-green)" />
        <StatCard accent="var(--gold)" icon={<Clock size={20} />} value={expired} label="Expired" delta="Past due" deltaIcon={<Clock size={10} />} deltaColor="var(--gold)" />
        <StatCard accent="var(--red)" icon={<XCircle size={20} />} value={blocked} label="Blocked" delta="Restricted" deltaIcon={<XCircle size={10} />} deltaColor="var(--red)" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartPanel title="Key Creation Trends" icon={<TrendingUp size={16} />} badge="30 days">
          {analytics?.keyTrends?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.keyTrends} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#14b8b8" />
                    <stop offset="100%" stopColor="#5eead4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 184, 0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#3a6168' }} stroke="rgba(20, 184, 184, 0.15)" tickFormatter={(v: string) => v.substring(5)} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#3a6168' }} stroke="rgba(20, 184, 184, 0.15)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ stroke: 'var(--teal-2)', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={tooltipStyle} labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11 }} itemStyle={{ color: '#e8f8f8' }} />
                <Line type="monotone" dataKey="count" stroke="url(#lineGrad)" strokeWidth={2.5} dot={{ fill: '#14b8b8', strokeWidth: 0, r: 3 }} activeDot={{ fill: '#5eead4', strokeWidth: 0, r: 5, style: { filter: 'drop-shadow(0 0 6px #5eead4)' } }} name="Keys Created" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartPanel>

        <ChartPanel title="Key Status Distribution" icon={<Activity size={16} />} badge={`${(analytics?.statusDistribution ?? []).filter(d => d.count > 0).length} types`}>
          {analytics?.statusDistribution && analytics.statusDistribution.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.statusDistribution.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={2}
                  stroke="rgba(2, 6, 8, 0.6)"
                  strokeWidth={2}
                >
                  {analytics.statusDistribution.filter(d => d.count > 0).map(entry => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status] || '#6b7280'} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11 }} itemStyle={{ color: '#e8f8f8' }} />
                <Legend verticalAlign="bottom" height={36} formatter={(value: string) => (
                  <span style={{ color: 'var(--text-mid)', fontSize: 11, fontFamily: 'var(--ff-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {value}
                  </span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartPanel>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartPanel title="Key Activity (30 Days)" icon={<Activity size={16} />} badge="Live">
          {analytics?.recentActivity?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.recentActivity} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5eead4" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expiredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0c040" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f0c040" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 184, 0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#3a6168' }} stroke="rgba(20, 184, 184, 0.15)" tickFormatter={(v: string) => v.substring(5)} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#3a6168' }} stroke="rgba(20, 184, 184, 0.15)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ stroke: 'var(--teal-2)', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={tooltipStyle} labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11 }} itemStyle={{ color: '#e8f8f8' }} />
                <Area type="monotone" dataKey="created" stroke="#5eead4" fill="url(#createdGrad)" strokeWidth={2} name="Created" />
                <Area type="monotone" dataKey="expired" stroke="#f0c040" fill="url(#expiredGrad)" strokeWidth={2} name="Expired" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartPanel>

        <ChartPanel title="Keys by Game" icon={<Gamepad2 size={16} />} badge={`${analytics?.gameDistribution?.length ?? 0} games`}>
          {analytics?.gameDistribution?.length ? (
            <ResponsiveContainer width="100%" height={Math.max(280, analytics.gameDistribution.length * 38)}>
              <BarChart data={analytics.gameDistribution} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 184, 0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#3a6168' }} stroke="rgba(20, 184, 184, 0.15)" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="game" tick={{ fontSize: 11, fill: '#8ab8be' }} stroke="rgba(20, 184, 184, 0.15)" width={90} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(20, 184, 184, 0.06)' }} contentStyle={tooltipStyle} labelStyle={{ color: '#8ab8be', fontFamily: 'var(--ff-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }} itemStyle={{ color: '#e8f8f8' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Keys">
                  {analytics.gameDistribution.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartPanel>
      </div>

      {/* Top performers + Account info */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPerformers data={analytics?.topPerformers ?? []} />
        </div>
        <AccountInfo user={user} />
      </div>

      <FtpStats />
      <LibDownloadLogs />
    </div>
  );
}

/* ============================================
   Subcomponents
   ============================================ */

function StatCard({
  accent, icon, value, label, delta, deltaIcon, deltaColor,
}: {
  accent: string;
  icon: React.ReactNode;
  value: number;
  label: string;
  delta: string;
  deltaIcon: React.ReactNode;
  deltaColor: string;
}) {
  return (
    <div
      className="stat-card panel-corner"
      style={
        {
          '--card-accent': accent,
          '--icon-bg': 'rgba(20, 184, 184, 0.05)',
          '--icon-border': 'rgba(20, 184, 184, 0.15)',
          '--icon-glow': `${accent}55`,
        } as React.CSSProperties
      }
    >
      <div className="stat-card-inner">
        <div>
          <div className="stat-val" style={{ color: accent }}>{value.toLocaleString()}</div>
          <div className="stat-lbl">{label}</div>
          <div className="stat-delta" style={{ color: deltaColor, opacity: 0.7 }}>
            {deltaIcon}
            {delta}
          </div>
        </div>
        <div className="stat-icon-wrap" style={{ color: accent, background: `${accent}15`, borderColor: `${accent}35` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ title, icon, badge, children }: { title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode }) {
  return (
    <div className="panel panel-corner fade-up d3">
      <div className="panel-head">
        <div className="panel-title">
          <span className="ico" style={{ color: 'var(--teal-2)' }}>{icon}</span>
          {title}
        </div>
        {badge && <span className="panel-badge">{badge}</span>}
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div
      style={{
        padding: '3rem 1rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-lo)',
        fontFamily: 'var(--ff-mono)',
        letterSpacing: '0.04em',
      }}
    >
      No data available
    </div>
  );
}

function TopPerformers({ data }: { data: { username: string; fullname: string; keysUsed: number; totalKeys: number; rank: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="panel panel-corner fade-up d4">
        <div className="panel-head">
          <div className="panel-title">
            <Sparkles size={16} className="ico" />
            Top Performers
          </div>
          <span className="panel-badge">0 entries</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon-ring"><Sparkles size={26} /></div>
          <div className="empty-title">No Performers Yet</div>
          <div className="empty-sub">Data will appear once keys are issued.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="panel panel-corner fade-up d4">
      <div className="panel-head">
        <div className="panel-title">
          <Sparkles size={16} className="ico" />
          Top Performers
        </div>
        <span className="panel-badge">by keys used</span>
      </div>
      <div style={{ padding: '0.85rem' }}>
        <div className="space-y-2">
          {data.map(p => {
            const usage = p.totalKeys > 0 ? Math.round((p.keysUsed / p.totalKeys) * 100) : 0;
            const rank = p.rank === 1
              ? { color: 'var(--gold)', glow: 'rgba(240, 192, 64, 0.15)', border: 'rgba(240, 192, 64, 0.3)' }
              : p.rank === 2
              ? { color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.12)', border: 'rgba(203, 213, 225, 0.28)' }
              : p.rank === 3
              ? { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.28)' }
              : { color: 'var(--text-mid)', glow: 'transparent', border: 'var(--border)' };
            return (
              <div
                key={p.username}
                className="flex items-center gap-3 rounded-xl border px-3 py-3 transition-all"
                style={{
                  background: `linear-gradient(90deg, ${rank.glow}, transparent 80%)`,
                  borderColor: rank.border,
                  boxShadow: `0 4px 16px ${rank.glow}`,
                }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center"
                  style={{
                    fontFamily: 'var(--ff-display)',
                    color: 'var(--text-hi)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}
                >
                  #{p.rank}
                </div>
                <div
                  className="relative h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', fontFamily: 'var(--ff-display)' }}
                >
                  {(p.fullname || p.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>
                    {p.fullname || p.username}
                  </p>
                  <p className="truncate text-xs mt-1" style={{ color: 'var(--text-lo)', fontFamily: 'var(--ff-mono)' }}>
                    @{p.username}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(20, 184, 184, 0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usage}%`,
                        background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2))',
                        boxShadow: '0 0 6px rgba(20, 184, 184, 0.4)',
                      }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ecto-green)', fontFamily: 'var(--ff-display)' }}>
                    {p.keysUsed}
                  </p>
                  <p className="text-xs tabular-nums" style={{ color: 'var(--text-lo)' }}>/ {p.totalKeys}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AccountInfo({ user }: { user: { username?: string; fullname?: string; level?: number; saldo?: number } | null }) {
  const level = user?.level ?? 3;
  const levelColor =
    level === 1
      ? { bg: 'rgba(240, 192, 64, 0.12)', color: 'var(--gold)', border: 'rgba(240, 192, 64, 0.3)' }
      : level === 2
      ? { bg: 'rgba(96, 165, 250, 0.12)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)' }
      : { bg: 'rgba(57, 255, 20, 0.1)', color: 'var(--ecto-green)', border: 'rgba(57, 255, 20, 0.28)' };

  return (
    <div className="panel panel-corner fade-up d4">
      <div className="panel-head">
        <div className="panel-title">
          <User size={16} className="ico" />
          Account Info
        </div>
        <span className="panel-badge">Profile</span>
      </div>
      <div style={{ padding: '1.25rem' }} className="space-y-2.5">
        <InfoRow icon={<User size={14} />} iconColor="var(--teal-2)" label="Username" value={user?.username} />
        <InfoRow
          icon={<Shield size={14} />}
          iconColor="var(--purple)"
          label="Level"
          value={
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: levelColor.bg,
                color: levelColor.color,
                border: `1px solid ${levelColor.border}`,
                fontFamily: 'var(--ff-mono)',
                letterSpacing: '0.08em',
              }}
            >
              {level === 1 ? 'Owner' : level === 2 ? 'Admin' : 'Reseller'}
            </span>
          }
        />
        <InfoRow
          icon={<DollarSign size={14} />}
          iconColor="var(--ecto-green)"
          label="Saldo"
          value={
            <span
              className="text-sm font-bold"
              style={{
                fontFamily: 'var(--ff-display)',
                background: 'linear-gradient(135deg, var(--ecto-green), var(--teal-3))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ${user?.saldo?.toFixed(2) ?? '0.00'}
            </span>
          }
        />
      </div>
    </div>
  );
}

function InfoRow({ icon, iconColor, label, value }: { icon: React.ReactNode; iconColor: string; label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex justify-between items-center px-3 py-2.5 rounded-lg"
      style={{ background: 'rgba(20, 184, 184, 0.05)', border: '1px solid var(--border)' }}
    >
      <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-mid)' }}>
        <span style={{ color: iconColor }}>{icon}</span>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-hi)' }}>{value}</span>
    </div>
  );
}
