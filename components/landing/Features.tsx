'use client';

import {
  Eye, Crosshair, Target, CircleDot, Package,
  Brain, MoveUp, Settings, Shield,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Eye size={18} />,
    name: 'ESP',
    description: 'See through walls with advanced overlay rendering. Real-time player detection up to 300m.',
  },
  {
    icon: <Target size={18} />,
    name: 'Aimbot',
    description: 'Precision targeting with customizable FOV, smoothness, and hitbox selection.',
  },
  {
    icon: <Crosshair size={18} />,
    name: 'Silent Aim',
    description: 'Undetectable targeting that keeps you under the radar. No suspicious movement patterns.',
  },
  {
    icon: <CircleDot size={18} />,
    name: 'Bullet Track',
    description: 'Smart trajectory prediction with auto-leading and drop compensation.',
  },
  {
    icon: <Package size={18} />,
    name: 'Item ESP',
    description: 'Enhanced loot visibility with rarity coloring and distance filtering.',
  },
  {
    icon: <Brain size={18} />,
    name: 'Memory',
    description: 'Direct memory access for reading game state. Bypass detection with kernel-level hooks.',
  },
  {
    icon: <MoveUp size={18} />,
    name: 'Floating HUD',
    description: 'Customizable overlay with live stats, minimap, and enemy tracking.',
  },
  {
    icon: <Settings size={18} />,
    name: 'Settings',
    description: 'Full configuration panel. Save profiles, hot-switch between setups instantly.',
  },
];

export function Features() {
  return (
    <section className="features-section" id="features">
      <div className="section-header">
        <span className="section-label">FEATURES</span>
        <h2 className="section-title">Arsenal Modules</h2>
        <p className="section-description">
          Comprehensive suite of tools designed for performance and reliability.
        </p>
      </div>

      <div className="features-grid">
        {FEATURES.map((feature) => (
          <div key={feature.name} className="feature-card">
            <div className="feature-icon">
              {feature.icon}
            </div>
            <h3 className="feature-name">{feature.name}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
