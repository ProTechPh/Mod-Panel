'use client';

import { Trophy, Medal, Award } from 'lucide-react';

interface TopPerformer { username: string; fullname: string; keysUsed: number; totalKeys: number; rank: number; }
interface TopPerformersProps { data: TopPerformer[]; }

const rankConfig = (rank: number) => {
  if (rank === 1) return { icon: Trophy, color: 'var(--gold)',     glow: 'rgba(240, 192, 64, 0.15)',  border: 'rgba(240, 192, 64, 0.3)' };
  if (rank === 2) return { icon: Medal,  color: '#cbd5e1',          glow: 'rgba(203, 213, 225, 0.12)', border: 'rgba(203, 213, 225, 0.28)' };
  if (rank === 3) return { icon: Award,  color: '#fb923c',          glow: 'rgba(251, 146, 60, 0.12)',  border: 'rgba(251, 146, 60, 0.28)' };
  return { icon: null, color: 'var(--text-mid)', glow: 'transparent', border: 'var(--border)' } as const;
};

export default function TopPerformers({ data }: TopPerformersProps) {
  if (!data || data.length === 0) {
    return (
      <div className="panel panel-corner fade-up d4">
        <div className="panel-head">
          <div className="panel-title">
            <Trophy size={16} className="ico" />
            Top Performers
          </div>
          <span className="panel-badge">0 entries</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon-ring">
            <Trophy size={26} />
          </div>
          <div className="empty-title">No Performers Yet</div>
          <div className="empty-sub">Data will appear once keys are issued.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel panel-corner fade-up d4">
      <div className="panel-head">
        <div className="panel-title">
          <Trophy size={16} className="ico" />
          Top Performers
        </div>
        <span className="panel-badge">by keys used</span>
      </div>
      <div style={{ padding: '0.85rem' }}>
        <div className="space-y-2">
          {data.map((performer) => {
            const usageRate = performer.totalKeys > 0 ? Math.round((performer.keysUsed / performer.totalKeys) * 100) : 0;
            const rank = rankConfig(performer.rank);
            const RankIcon = rank.icon;

            return (
              <div
                key={performer.username}
                className="flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-300 hover:translate-y-[-1px]"
                style={{
                  background: `linear-gradient(90deg, ${rank.glow}, transparent 80%)`,
                  borderColor: rank.border,
                  boxShadow: `0 4px 16px ${rank.glow}`,
                }}
              >
                {/* Rank */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  {RankIcon ? (
                    <RankIcon className="h-4 w-4" style={{ color: rank.color, filter: `drop-shadow(0 0 4px ${rank.color})` }} />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: 'var(--text-mid)', fontFamily: 'var(--ff-display)' }}
                    >
                      {performer.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative h-9 w-9 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                      filter: 'blur(4px)',
                      opacity: 0.4,
                    }}
                  />
                  <div
                    className="relative h-full w-full rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                      fontFamily: 'var(--ff-display)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {(performer.fullname || performer.username).slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Name + progress */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold leading-none"
                    style={{ color: 'var(--text-hi)' }}
                  >
                    {performer.fullname || performer.username}
                  </p>
                  <p
                    className="truncate text-xs mt-1"
                    style={{ color: 'var(--text-lo)', fontFamily: 'var(--ff-mono)' }}
                  >
                    @{performer.username}
                  </p>
                  <div
                    className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden"
                    style={{ background: 'rgba(20, 184, 184, 0.08)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${usageRate}%`,
                        background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2))',
                        boxShadow: '0 0 6px rgba(20, 184, 184, 0.4)',
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right">
                  <p
                    className="text-sm font-bold tabular-nums"
                    style={{ color: 'var(--ecto-green)', fontFamily: 'var(--ff-display)' }}
                  >
                    {performer.keysUsed}
                  </p>
                  <p
                    className="text-xs tabular-nums"
                    style={{ color: 'var(--text-lo)' }}
                  >
                    / {performer.totalKeys}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
