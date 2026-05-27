'use client';

import { useEffect, useState } from 'react';
import StatsCards from '@/components/dashboard/StatsCards';
import KeyTrendsChart from '@/components/dashboard/KeyTrendsChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import GameDistChart from '@/components/dashboard/GameDistChart';
import ActivityChart from '@/components/dashboard/ActivityChart';
import TopPerformers from '@/components/dashboard/TopPerformers';
import FtpStats from '@/components/dashboard/FtpStats';
import LibDownloadLogs from '@/components/dashboard/LibDownloadLogs';
import Announcements from '@/components/dashboard/Announcements';
import ExpiryNotificationBanner from '@/components/dashboard/ExpiryNotificationBanner';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, User, Shield, DollarSign } from 'lucide-react';

interface DashboardAnalytics {
  keyStats: { total: number; active: number; expired: number; blocked: number; unused: number };
  keyTrends: { date: string; count: number }[];
  gameDistribution: { game: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  userLevelDistribution: { owners: number; admins: number; resellers: number };
  recentActivity: { date: string; created: number; expired: number }[];
  topPerformers: { username: string; fullname: string; keysUsed: number; totalKeys: number; rank: number }[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/10 via-fuchsia-500/5 to-cyan-500/10 rounded-2xl blur-xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Dashboard</h2>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-muted-foreground/80 flex items-center gap-2">
              Welcome back, <span className="font-medium text-foreground">{user?.fullname || user?.username}</span>
            </p>
          </div>
        </div>
      </div>

      <ExpiryNotificationBanner />
      <Announcements />
      <StatsCards stats={analytics?.keyStats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <KeyTrendsChart data={analytics?.keyTrends ?? []} />
        <StatusPieChart data={analytics?.statusDistribution ?? []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart data={analytics?.recentActivity ?? []} />
        <GameDistChart data={analytics?.gameDistribution ?? []} />
      </div>

      <TopPerformers data={analytics?.topPerformers ?? []} />
      <FtpStats />
      <LibDownloadLogs />

      {/* Account Info Card */}
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-purple-400" />
                  Username
                </span>
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-fuchsia-400" />
                  Level
                </span>
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                  user?.level === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                  user?.level === 2 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {user?.level === 1 ? 'Owner' : user?.level === 2 ? 'Admin' : 'Reseller'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
                  Saldo
                </span>
                <span className="text-sm font-mono font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ${user?.saldo?.toFixed(2) ?? '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
