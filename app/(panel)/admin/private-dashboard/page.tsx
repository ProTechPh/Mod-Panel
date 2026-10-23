'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldAlert } from 'lucide-react';

export default function PrivateDashboardPage() {
  const { user } = useAuth();

  if (user?.level !== 1) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <div className="state-icon state-icon--danger">
            <ShieldAlert aria-hidden className="size-6" />
          </div>
          <p className="state-eyebrow">Restricted</p>
          <h1 className="state-title">Access denied</h1>
          <p className="state-sub">Owner clearance is required to open the private dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="[ OWNER CLEARANCE ]"
        title="Private"
        highlight="Dashboard"
        sub="Server-wide statistics and management."
      />
      <StatsCards />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock aria-hidden className="size-4 text-[var(--brand-500)]" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Server-wide statistics and management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
