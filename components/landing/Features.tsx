'use client';

import {
  Eye, Crosshair, Target, CircleDot, Package,
  Brain, MoveUp, Settings, Sparkles,
} from 'lucide-react';
import '@/components/landing/landing.css';

const FEATURES = [
  {
    icon: <Eye className="size-5" />,
    name: 'ESP',
    description: 'See through walls with advanced overlay rendering. Real-time player detection up to 300m.',
    accent: '#4ade80',
    bg: 'rgba(74, 222, 128, 0.1)',
    border: 'rgba(74, 222, 128, 0.2)',
  },
  {
    icon: <Target className="size-5" />,
    name: 'Aimbot',
    description: 'Precision targeting with customizable FOV, smoothness, and hitbox selection.',
    accent: '#f87171',
    bg: 'rgba(248, 113, 113, 0.1)',
    border: 'rgba(248, 113, 113, 0.2)',
  },
  {
    icon: <Crosshair className="size-5" />,
    name: 'Silent Aim',
    description: 'Undetectable targeting that keeps you under the radar. No suspicious movement patterns.',
    accent: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.1)',
    border: 'rgba(192, 132, 252, 0.2)',
  },
  {
    icon: <CircleDot className="size-5" />,
    name: 'Bullet Track',
    description: 'Smart trajectory prediction with auto-leading and drop compensation.',
    accent: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.1)',
    border: 'rgba(96, 165, 250, 0.2)',
  },
  {
    icon: <Package className="size-5" />,
    name: 'Item ESP',
    description: 'Enhanced loot visibility with rarity coloring and distance filtering.',
    accent: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.2)',
  },
  {
    icon: <Brain className="size-5" />,
    name: 'Memory',
    description: 'Direct memory access for reading game state. Bypass detection with kernel-level hooks.',
    accent: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.1)',
    border: 'rgba(167, 139, 250, 0.2)',
  },
  {
    icon: <MoveUp className="size-5" />,
    name: 'Floating HUD',
    description: 'Customizable overlay with live stats, minimap, and enemy tracking.',
    accent: '#2dd4bf',
    bg: 'rgba(45, 212, 191, 0.1)',
    border: 'rgba(45, 212, 191, 0.2)',
  },
  {
    icon: <Settings className="size-5" />,
    name: 'Settings',
    description: 'Full configuration panel. Save profiles, hot-switch between setups instantly.',
    accent: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.2)',
  },
];

export function Features() {
  return (
    <div className="panel fade-up d2 panel-corner" id="features">
      <div className="panel-head">
        <div className="panel-title">
          <Sparkles className="ico" size={16} />
          Arsenal Modules
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="panel-badge">{FEATURES.length} modules</span>
          <a href="#features" className="view-all-link">
            View All
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>

      <div className="feature-grid" style={{ padding: '1.1rem' }}>
        {FEATURES.map((feature) => (
          <div
            key={feature.name}
            className="feature-item"
            style={{
              '--feat-accent': feature.accent,
              '--feat-bg': feature.bg,
              '--feat-border': feature.border,
            } as React.CSSProperties}
          >
            <div className="feature-head">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <div className="feature-name">{feature.name}</div>
            </div>
            <p className="feature-desc">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
