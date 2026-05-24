'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface TopPerformer { username: string; fullname: string; keysUsed: number; totalKeys: number; rank: number; }
interface TopPerformersProps { data: TopPerformer[]; }

const rankConfig = (rank: number) => {
  if (rank === 1) return { icon: Trophy, bg: 'from-yellow-400/20 to-yellow-500/10 border-yellow-500/30', iconColor: 'text-yellow-400', glow: 'shadow-yellow-500/10' };
  if (rank === 2) return { icon: Medal, bg: 'from-slate-300/20 to-slate-400/10 border-slate-400/30', iconColor: 'text-slate-300', glow: 'shadow-slate-400/10' };
  if (rank === 3) return { icon: Award, bg: 'from-amber-600/20 to-amber-700/10 border-amber-600/30', iconColor: 'text-amber-500', glow: 'shadow-amber-600/10' };
  return { icon: null, bg: 'from-muted/20 to-muted/10 border-border/30', iconColor: 'text-muted-foreground', glow: '' } as const;
};

export default function TopPerformers({ data }: TopPerformersProps) {
  if (!data || data.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground/60 text-center py-6">No data yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top Performers
            <span className="ml-auto text-xs text-muted-foreground/60 font-normal">by keys used</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((performer) => {
              const usageRate = performer.totalKeys > 0 ? Math.round((performer.keysUsed / performer.totalKeys) * 100) : 0;
              const rank = rankConfig(performer.rank);
              const RankIcon = rank.icon;

              return (
                <div
                  key={performer.username}
                  className={`relative flex items-center gap-3 rounded-xl border bg-gradient-to-r ${rank.bg} px-3 py-3 transition-all duration-300 hover:scale-[1.01] ${rank.glow}`}
                >
                  {/* Rank */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {RankIcon ? <RankIcon className={`h-4 w-4 ${rank.iconColor}`} /> : (
                      <span className="text-xs font-bold text-muted-foreground">{performer.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="relative h-9 w-9 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full opacity-30 blur-sm" />
                    <div className="relative h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                      {(performer.fullname || performer.username).slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Name + progress */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-none">{performer.fullname || performer.username}</p>
                    <p className="truncate text-xs text-muted-foreground/60 mt-0.5">@{performer.username}</p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-700"
                        style={{ width: `${usageRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums">{performer.keysUsed}</p>
                    <p className="text-xs text-muted-foreground/60 tabular-nums">/ {performer.totalKeys}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
