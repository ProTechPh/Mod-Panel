'use client';

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
  {
    label: 'Total Keys',
    value: (s?: KeyStats) => s?.total ?? 0,
    icon: Key,
    accent: 'var(--teal-2)',
    iconBg: 'rgba(20, 184, 184, 0.1)',
    iconBorder: 'rgba(20, 184, 184, 0.2)',
    iconGlow: 'rgba(20, 184, 184, 0.3)',
  },
  {
    label: 'Active',
    value: (s?: KeyStats) => s?.active ?? 0,
    icon: CheckCircle,
    accent: 'var(--ecto-green)',
    iconBg: 'rgba(57, 255, 20, 0.08)',
    iconBorder: 'rgba(57, 255, 20, 0.22)',
    iconGlow: 'rgba(57, 255, 20, 0.3)',
  },
  {
    label: 'Expired',
    value: (s?: KeyStats) => s?.expired ?? 0,
    icon: Clock,
    accent: 'var(--gold)',
    iconBg: 'rgba(240, 192, 64, 0.1)',
    iconBorder: 'rgba(240, 192, 64, 0.22)',
    iconGlow: 'rgba(240, 192, 64, 0.3)',
  },
  {
    label: 'Blocked',
    value: (s?: KeyStats) => s?.blocked ?? 0,
    icon: XCircle,
    accent: 'var(--red)',
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconBorder: 'rgba(239, 68, 68, 0.22)',
    iconGlow: 'rgba(239, 68, 68, 0.3)',
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="stat-row fade-up d2">
      {cards.map((card) => {
        const val = card.value(stats);
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="stat-card panel-corner"
            style={
              {
                '--card-accent': card.accent,
                '--icon-bg': card.iconBg,
                '--icon-border': card.iconBorder,
                '--icon-glow': card.iconGlow,
              } as React.CSSProperties
            }
          >
            <div className="stat-card-inner">
              <div>
                <div
                  className="stat-val"
                  style={{ color: card.accent }}
                >
                  {val.toLocaleString()}
                </div>
                <div className="stat-lbl">{card.label}</div>
                {val > 0 && (
                  <div className="stat-delta" style={{ color: card.accent, opacity: 0.7 }}>
                    <TrendingUp style={{ fontSize: '0.7rem' }} /> Active
                  </div>
                )}
              </div>
              <div className="stat-icon-wrap" style={{ color: card.accent }}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
