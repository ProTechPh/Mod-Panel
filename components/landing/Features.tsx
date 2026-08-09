'use client';

import Link from 'next/link';
import { ArrowUpRight, Crosshair, ShieldAlert, Zap, Compass, Gamepad2 } from 'lucide-react';

export function Features() {
  return (
    <section className="features-section" id="store">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <span className="section-label" style={{ fontFamily: 'var(--ff-mono)' }}>
          [ ACTIVE MODULES ]
        </span>
        <h2 className="section-title" style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Game Systems Library
        </h2>
        <p className="section-description">
          Explore and launch kernel-level modifications for supported platforms.
        </p>
      </div>

      <div className="game-grid">
        {/* Call of Duty Mobile Card */}
        <div
          className="game-card"
          style={{
            '--card-glow-color': 'var(--teal-2)',
            '--card-glow-shadow': 'rgba(234, 88, 12, 0.25)',
            '--game-bg-gradient': 'linear-gradient(135deg, #ea580c, #c2410c)'
          } as React.CSSProperties}
        >
          <div className="game-card-bg" />
          <Link href="/register" className="game-card-action-btn">
            <ArrowUpRight size={16} />
          </Link>
          <div className="game-card-content">
            <span className="game-card-tag">FPS / Battle Royale</span>
            <h3 className="game-card-title">Call of Duty Mobile</h3>
            
            <div className="flex flex-col gap-1.5 my-3.5 font-sans text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Crosshair size={12} className="text-orange-500" />
                <span>Memory Aimbot & Recoil Reducer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-orange-500" />
                <span>Real-time Wallhack & Item ESP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={12} className="text-orange-500" />
                <span>Anti-Cheat Kernel Bypass</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="status-pill-active">UNDETECTED</span>
              <span className="font-mono text-[10px] text-slate-500">v3.2.0</span>
            </div>
          </div>
        </div>

        {/* Mobile Legends Card */}
        <div
          className="game-card"
          style={{
            '--card-glow-color': 'var(--teal-neon)',
            '--card-glow-shadow': 'rgba(250, 204, 21, 0.25)',
            '--game-bg-gradient': 'linear-gradient(135deg, #ea580c, #facc15)'
          } as React.CSSProperties}
        >
          <div className="game-card-bg" />
          <Link href="/register" className="game-card-action-btn">
            <ArrowUpRight size={16} />
          </Link>
          <div className="game-card-content">
            <span className="game-card-tag">MOBA / Arena</span>
            <h3 className="game-card-title">Mobile Legends: BB</h3>

            <div className="flex flex-col gap-1.5 my-3.5 font-sans text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Compass size={12} className="text-yellow-500" />
                <span>Minimap Radar Hack & Room Info</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-yellow-500" />
                <span>Full Skin Unlocker & Effects Injector</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gamepad2 size={12} className="text-yellow-500" />
                <span>Drone Camera Views & 120 FPS</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="status-pill-gold">ACTIVE BYPASS</span>
              <span className="font-mono text-[10px] text-slate-500">v2.1.4</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
