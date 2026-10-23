'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart } from 'recharts';
import { MousePointerClick, TrendingUp, Eye, Clock, Users, BarChart3, Zap, Crown, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface AdClaimTrend {
  date: string;
  claims: number;
  extensions: number;
}

interface GameAdStats {
  game: string;
  totalAdClaims: number;
  totalExtensions: number;
  activeKeys: number;
}

interface TopAdSupporter {
  maskedIp: string;
  totalClaims: number;
  threeHourClaims: number;
  extensions: number;
  lastClaim: string;
}

interface TopAdPerformer {
  registrator: string;
  totalKeys: number;
  activeKeys: number;
  adClaims: number;
  extensions: number;
  revenueEstimate: number;
  lastActivity: string;
}

interface DailyRevenue {
  date: string;
  adImpressions: number;
  uniqueIps: number;
}

interface AdsAnalytics {
  totalAdClaims: number;
  total3hClaims: number;
  totalExtensions: number;
  total3hActive: number;
  adClaimTrends: AdClaimTrend[];
  gameAdStats: GameAdStats[];
  topSupporters: TopAdSupporter[];
  topPerformers: TopAdPerformer[];
  dailyRevenue: DailyRevenue[];
}

const tooltipStyle = {
  backgroundColor: '#14161e',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  fontSize: 12,
  color: '#f1f5f9',
};

const labelStyle = { color: '#a3aebf' };
const itemStyle = { color: '#f1f5f9' };

export default function AdsAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/ads-analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data.data);
        } else {
          toast.error('Failed to load ads analytics');
        }
      })
      .catch(() => toast.error('Failed to load ads analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.level !== 1) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <div className="state-icon state-icon--danger">
            <ShieldAlert aria-hidden className="size-6" />
          </div>
          <p className="state-eyebrow">Restricted</p>
          <h1 className="state-title">Access denied</h1>
          <p className="state-sub">Ad analytics is available to owners only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading-spinner" aria-label="Loading analytics" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          No data available
        </p>
      </div>
    );
  }

  const statsCards = [
    { label: 'Total Ad Claims', value: analytics.totalAdClaims, icon: MousePointerClick, accent: 'var(--brand-500)' },
    { label: '3h Key Claims', value: analytics.total3hClaims, icon: TrendingUp, accent: 'var(--ecto-green)' },
    { label: 'Key Extensions', value: analytics.totalExtensions, icon: Zap, accent: 'var(--gold)' },
    { label: 'Active 3h Keys', value: analytics.total3hActive, icon: Clock, accent: 'var(--purple)' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="[ ACQUISITION TELEMETRY ]"
        title="Ads"
        highlight="Analytics"
        sub="Free-key claim volume, extensions, and top performers across the last 30 days."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map(card => (
          <div key={card.label} className="relative group">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon aria-hidden className="size-4" style={{ color: card.accent }} />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold tabular-nums tracking-tight">
                  {card.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Ad Claim Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--brand-400)]" />
                Ad Claim Trends
                <span className="ml-auto text-xs text-muted-foreground font-normal">Last 30 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.adClaimTrends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.adClaimTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252832" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      stroke="#3a3f4b"
                      tickFormatter={(v: string) => v.substring(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#3a3f4b" />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="claims" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.3} name="3h Claims" />
                    <Area type="monotone" dataKey="extensions" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} name="Extensions" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Unique Users & Impressions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-[var(--purple)]" />
                Daily Impressions & Unique IPs
                <span className="ml-auto text-xs text-muted-foreground font-normal">Last 30 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.dailyRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252832" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      stroke="#3a3f4b"
                      tickFormatter={(v: string) => v.substring(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#3a3f4b" />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="adImpressions" stroke="#a78bfa" strokeWidth={2} dot={false} name="Ad Impressions" />
                    <Line type="monotone" dataKey="uniqueIps" stroke="#22c55e" strokeWidth={2} dot={false} name="Unique IPs" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Ad Stats */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--ecto-green)]" />
              Ad Performance by Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.gameAdStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.gameAdStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#252832" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#3a3f4b" />
                      <YAxis type="category" dataKey="game" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#3a3f4b" width={80} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                      <Legend />
                      <Bar dataKey="totalAdClaims" fill="#f97316" radius={[0, 4, 4, 0]} name="Ad Claims" />
                      <Bar dataKey="totalExtensions" fill="#a78bfa" radius={[0, 4, 4, 0]} name="Extensions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-right">Claims</TableHead>
                        <TableHead className="text-right">Extensions</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.gameAdStats.map((stat) => (
                        <TableRow key={stat.game}>
                          <TableCell className="font-medium">{stat.game}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{stat.totalAdClaims}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{stat.totalExtensions}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-green-500/10 text-[var(--ecto-green)] border-green-500/30">{stat.activeKeys}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Ad Performers */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-[var(--gold)]" />
              Top Ad Performers
              <span className="ml-auto text-xs text-muted-foreground font-normal">by total free keys generated</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Total Keys</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Ad Claims</TableHead>
                    <TableHead className="text-right">Extensions</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topPerformers.map((performer, idx) => (
                    <TableRow key={performer.registrator}>
                      <TableCell>
                        <span className={`font-mono text-xs font-bold ${idx < 3 ? 'text-[var(--gold)]' : 'text-[var(--text-lo)]'}`}>{idx + 1}</span>
                      </TableCell>
                      <TableCell className="font-medium">{performer.registrator}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{performer.totalKeys}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-500/10 text-[var(--ecto-green)] border-green-500/30">{performer.activeKeys}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-500/10 text-[var(--brand-400)] border-blue-500/30">{performer.adClaims}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-[rgba(167,139,250,0.12)] text-[var(--purple)] border-[rgba(167,139,250,0.3)]">{performer.extensions}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(performer.lastActivity).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Ad Supporters */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--gold)]" />
              Top Ad Supporters
              <span className="ml-auto text-xs text-muted-foreground font-normal">by total ad interactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topSupporters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Total Claims</TableHead>
                    <TableHead className="text-right">3h Claims</TableHead>
                    <TableHead className="text-right">Extensions</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topSupporters.map((supporter, idx) => (
                    <TableRow key={supporter.maskedIp}>
                      <TableCell>
                        <span className={`font-mono text-xs font-bold ${idx < 3 ? 'text-[var(--gold)]' : 'text-[var(--text-lo)]'}`}>{idx + 1}</span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{supporter.maskedIp}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{supporter.totalClaims}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-500/10 text-[var(--brand-400)] border-blue-500/30">{supporter.threeHourClaims}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-[rgba(167,139,250,0.12)] text-[var(--purple)] border-[rgba(167,139,250,0.3)]">{supporter.extensions}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(supporter.lastClaim).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
