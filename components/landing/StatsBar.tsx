'use client';

import {
  ShieldCheck, Zap, TrendingUp,
  Activity, Users, Tag, Wrench, Lock,
} from 'lucide-react';
import '@/components/landing/landing.css';

interface StatsBarProps {
  version: string;
  activeKeys: number;
  totalSlots: number;
  maintenanceOn: boolean;
}

export function StatsBar({ version, activeKeys, totalSlots, maintenanceOn }: StatsBarProps) {
  return (
    <div className="stat-row">
      <div
        className="stat-card fade-up d1 panel-corner"
        style={{
          '--card-accent': 'var(--teal-2)',
          '--icon-bg': 'rgba(20, 184, 184, 0.1)',
          '--icon-border': 'rgba(20, 184, 184, 0.2)',
          '--icon-glow': 'rgba(20, 184, 184, 0.3)',
        } as React.CSSProperties}
      >
        <div className="stat-card-inner">
          <div>
            <div className="stat-val">{activeKeys.toLocaleString()}</div>
            <div className="stat-lbl">Active Sessions</div>
            <div className="stat-delta">
              <Activity style={{ fontSize: '0.7rem' }} /> Real-time
            </div>
          </div>
          <div className="stat-icon-wrap">
            <Users size={20} />
          </div>
        </div>
      </div>

      <div
        className="stat-card fade-up d2 panel-corner"
        style={{
          '--card-accent': 'var(--gold)',
          '--icon-bg': 'rgba(240, 192, 64, 0.1)',
          '--icon-border': 'rgba(240, 192, 64, 0.2)',
          '--icon-glow': 'rgba(240, 192, 64, 0.3)',
        } as React.CSSProperties}
      >
        <div className="stat-card-inner">
          <div>
            <div className="stat-val" style={{ color: 'var(--gold)' }}>{version || 'v3.2'}</div>
            <div className="stat-lbl">Latest Build</div>
            <div className="stat-delta" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              <Zap style={{ fontSize: '0.7rem' }} /> Stable release
            </div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(240, 192, 64, 0.1)', borderColor: 'rgba(240, 192, 64, 0.2)', color: 'var(--gold)' }}>
            <Tag size={20} />
          </div>
        </div>
      </div>

      <div
        className="stat-card fade-up d3 panel-corner"
        style={{
          '--card-accent': 'var(--ecto-green)',
          '--icon-bg': 'rgba(57, 255, 20, 0.08)',
          '--icon-border': 'rgba(57, 255, 20, 0.2)',
          '--icon-glow': 'rgba(57, 255, 20, 0.3)',
        } as React.CSSProperties}
      >
        <div className="stat-card-inner">
          <div>
            <div className="stat-val" style={{ color: 'var(--ecto-green)' }}>
              {totalSlots.toLocaleString()}
            </div>
            <div className="stat-lbl">Total Capacity</div>
            <div className="stat-delta">
              <ShieldCheck style={{ fontSize: '0.7rem' }} /> 99.9% uptime
            </div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(57, 255, 20, 0.08)', borderColor: 'rgba(57, 255, 20, 0.2)', color: 'var(--ecto-green)' }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      <div
        className="stat-card fade-up d4 panel-corner"
        style={{
          '--card-accent': maintenanceOn ? 'var(--gold)' : 'var(--purple)',
          '--icon-bg': maintenanceOn ? 'rgba(240, 192, 64, 0.08)' : 'rgba(167, 139, 250, 0.08)',
          '--icon-border': maintenanceOn ? 'rgba(240, 192, 64, 0.2)' : 'rgba(167, 139, 250, 0.2)',
          '--icon-glow': maintenanceOn ? 'rgba(240, 192, 64, 0.3)' : 'rgba(167, 139, 250, 0.3)',
        } as React.CSSProperties}
      >
        <div className="stat-card-inner">
          <div>
            <div
              className="stat-val"
              style={{ color: maintenanceOn ? 'var(--gold)' : 'var(--purple)' }}
            >
              {maintenanceOn ? 'MAINT' : 'SECURE'}
            </div>
            <div className="stat-lbl">System Status</div>
            <div className="stat-delta" style={{ color: maintenanceOn ? 'var(--gold)' : 'var(--purple)', opacity: 0.7 }}>
              <Wrench style={{ fontSize: '0.7rem' }} /> {maintenanceOn ? 'Maintenance' : 'All systems'}
            </div>
          </div>
          <div
            className="stat-icon-wrap"
            style={{
              background: maintenanceOn ? 'rgba(240, 192, 64, 0.08)' : 'rgba(167, 139, 250, 0.08)',
              borderColor: maintenanceOn ? 'rgba(240, 192, 64, 0.2)' : 'rgba(167, 139, 250, 0.2)',
              color: maintenanceOn ? 'var(--gold)' : 'var(--purple)',
            }}
          >
            {maintenanceOn ? <Wrench size={20} /> : <Lock size={20} />}
          </div>
        </div>
      </div>
    </div>
  );
}
