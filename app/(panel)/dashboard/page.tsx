'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.fullname || user?.username}</p>
      </div>

      <StatsCards />

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