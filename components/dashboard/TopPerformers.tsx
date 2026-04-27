'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface TopPerformer {
  username: string;
  fullname: string;
  keysUsed: number;
  totalKeys: number;
  rank: number;
}

interface TopPerformersProps {
  data: TopPerformer[];
}

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
  return (
    <span className="h-4 w-4 flex items-center justify-center text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
};

const rankBg = (rank: number) => {
  if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30';
  if (rank === 2) return 'bg-slate-500/10 border-slate-400/30';
  if (rank === 3) return 'bg-amber-700/10 border-amber-600/30';
  return 'bg-muted/30 border-border/40';
};

export default function TopPerformers({ data }: TopPerformersProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Top Performers
          <span className="ml-auto text-xs text-muted-foreground font-normal">by keys used</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((performer) => {
            const usageRate =
              performer.totalKeys > 0
                ? Math.round((performer.keysUsed / performer.totalKeys) * 100)
                : 0;

            return (
              <div
                key={performer.username}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${rankBg(performer.rank)}`}
              >
                {/* Rank */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {rankIcon(performer.rank)}
                </div>

                {/* Avatar initials */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(performer.fullname || performer.username).slice(0, 2).toUpperCase()}
                </div>

                {/* Name + progress */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-none">
                    {performer.fullname || performer.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    @{performer.username}
                  </p>
                  {/* Usage bar */}
                  <div className="mt-1.5 h-1 w-full rounded-full bg-border/50">
                    <div
                      className="h-1 rounded-full bg-primary transition-all"
                      style={{ width: `${usageRate}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums">{performer.keysUsed}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    / {performer.totalKeys}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
