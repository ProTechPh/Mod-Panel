'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function PrivateDashboardPage() {
  const { user } = useAuth();
  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Owner Dashboard</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>
      <StatsCards />
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader><CardTitle className="text-lg">System Overview</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Server-wide statistics and management.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
