'use client';

import { useEffect, useState } from 'react';
import StatsCards from '@/components/dashboard/StatsCards';
import KeyTrendsChart from '@/components/dashboard/KeyTrendsChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import GameDistChart from '@/components/dashboard/GameDistChart';
import ActivityChart from '@/components/dashboard/ActivityChart';
import TopPerformers from '@/components/dashboard/TopPerformers';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.fullname || user?.username}</p>
      </div>

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

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Account Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span>{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span>{user?.level === 1 ? 'Owner' : user?.level === 2 ? 'Admin' : 'Reseller'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo</span>
              <span className="font-mono">${user?.saldo?.toFixed(2) ?? '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}