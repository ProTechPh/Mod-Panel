'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivateDashboardPage() {
  const { user } = useAuth();

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Owner Dashboard</h2>
      <StatsCards />
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Server-wide statistics and management.</p>
        </CardContent>
      </Card>
    </div>
  );
}