'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface KeyStats {
  total: number;
  active: number;
  expired: number;
  blocked: number;
  unused: number;
}

interface StatsCardsProps {
  stats?: KeyStats;
}

const cards = [
  { label: 'Total Keys', value: (s?: KeyStats) => s?.total ?? 0, icon: Key, glow: 'group-hover:shadow-purple-500/20', line: 'from-purple-500 to-fuchsia-500', iconBg: 'bg-purple-500/10 text-purple-400' },
  { label: 'Active', value: (s?: KeyStats) => s?.active ?? 0, icon: CheckCircle, glow: 'group-hover:shadow-emerald-500/20', line: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-500/10 text-emerald-400' },
  { label: 'Expired', value: (s?: KeyStats) => s?.expired ?? 0, icon: Clock, glow: 'group-hover:shadow-amber-500/20', line: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-500/10 text-amber-400' },
  { label: 'Blocked', value: (s?: KeyStats) => s?.blocked ?? 0, icon: XCircle, glow: 'group-hover:shadow-red-500/20', line: 'from-red-500 to-rose-500', iconBg: 'bg-red-500/10 text-red-400' },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map(card => {
        const val = card.value(stats);
        return (
          <div key={card.label} className={`relative group transition-all duration-300 hover:scale-[1.02] ${card.glow}`}>
            <div className={`absolute -inset-[1px] bg-gradient-to-r ${card.line} rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-md`} />
            <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-[0.03]" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-bold tabular-nums">{val.toLocaleString()}</div>
                  {val > 0 && (
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.line} opacity-30`} />
            </Card>
          </div>
        );
      })}
    </div>
  );
}
