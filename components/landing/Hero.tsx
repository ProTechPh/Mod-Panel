'use client';

import Link from 'next/link';
import { APP_NAME } from '@/lib/constants/app';
import { ArrowUpRight, ShieldCheck, Terminal, Cpu, Clock, Key } from 'lucide-react';

interface HeroProps {
  totalKeys: string;
  uptime: string;
  countries: string;
}

export function Hero({ totalKeys, uptime }: HeroProps) {
  return (
    <section className="cmd-banner fade-up" style={{ maxWidth: '1200px', margin: '1.5rem auto' }}>
      <div className="cmd-grid" />
      
      {/* Title bar of the virtual console */}
      <div className="cmd-statusbar">
        <div className="cmd-status-left">
          <Terminal size={12} className="cmd-status-icon" />
          <span>SECURITY NODE // CONNECTED</span>
          <span className="cmd-status-sep">|</span>
          <span className="cmd-status-text">NOMINAL STATUS</span>
        </div>
        <div className="cmd-status-right">
          <span className="cmd-live-tag">
            <span className="cmd-live-dot" />
            LIVE DETECT BYPASS
          </span>
        </div>
      </div>

      <div className="cmd-body">
        <div className="cmd-main">
          <span className="cmd-eyebrow">
            <span className="cmd-bracket">[</span> ACTIVE CHEAT INJECTOR PORTAL <span className="cmd-bracket">]</span>
          </span>
          <div className="cmd-title">
            <span className="cmd-title-prefix">Welcome Operator to</span>
            <h1 className="cmd-title-name">{APP_NAME} HUB</h1>
          </div>
          <p className="cmd-sub">
            The definitive gaming bypass network. High-performance memory edits, instant license key verification, and continuous security overrides for competitive play.
          </p>
          <div className="cmd-actions">
            <Link href="/register" className="cmd-btn cmd-btn-primary">
              Create Reseller Account
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/login" className="cmd-btn cmd-btn-ghost">
              Operator Sign In
            </Link>
          </div>
        </div>

        {/* Tactical Telemetry widget directly in Hero */}
        <div className="cmd-telemetry">
          <div className="cmd-telemetry-head">
            <Cpu size={12} />
            <span>SYSTEM MONITOR</span>
            <div className="cmd-telemetry-line" />
          </div>

          <div className="cmd-telemetry-grid">
            <div className="cmd-tele-block green">
              <div className="cmd-tele-icon">
                <ShieldCheck size={14} />
              </div>
              <div className="cmd-tele-meta">
                <span className="cmd-tele-lbl">Bypass Engine</span>
                <div className="cmd-tele-val">ACTIVE<span className="cmd-tele-unit"> / 100% SAFE</span></div>
              </div>
              <div className="cmd-tele-bar">
                <div className="cmd-tele-bar-fill" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="cmd-tele-block">
              <div className="cmd-tele-icon">
                <Key size={14} />
              </div>
              <div className="cmd-tele-meta">
                <span className="cmd-tele-lbl">Issued Keys</span>
                <div className="cmd-tele-val">{totalKeys}</div>
              </div>
              <div className="cmd-tele-bar">
                <div className="cmd-tele-bar-fill" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="cmd-tele-block gold">
              <div className="cmd-tele-icon">
                <Clock size={14} />
              </div>
              <div className="cmd-tele-meta">
                <span className="cmd-tele-lbl">Core Uptime</span>
                <div className="cmd-tele-val">{uptime}</div>
              </div>
              <div className="cmd-tele-bar">
                <div className="cmd-tele-bar-fill" style={{ width: '99.9%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
