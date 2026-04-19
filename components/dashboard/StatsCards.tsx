'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/shared/AuthProvider';
import { Key, CheckCircle, XCircle, Clock } from 'lucide-react';

interface KeyStats {
  total: number;
  active: number;
  expired: number;
  blocked: number;
  unused: number;
}

export default function StatsCards() {
  const { user } = useAuth();
  const [stats, setStats] = useState<KeyStats | null>(null);

  useEffect(() => {
    fetch('/api/keys/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Keys', value: stats?.total ?? 0, icon: Key, color: 'text-blue-500' },
    { label: 'Active', value: stats?.active ?? 0, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Expired', value: stats?.expired ?? 0, icon: Clock, color: 'text-yellow-500' },
    { label: 'Blocked', value: stats?.blocked ?? 0, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.label} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}