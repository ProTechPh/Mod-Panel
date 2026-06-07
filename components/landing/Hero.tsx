'use client';

import Link from 'next/link';
import { APP_NAME } from '@/lib/constants/app';
import '@/components/landing/landing.css';

interface HeroProps {
  activeUsers: string;
  totalKeys: string;
  uptime: string;
  countries: string;
}

export function Hero({ activeUsers, totalKeys, uptime, countries }: HeroProps) {
  return (
    <section className="welcome-banner fade-up">
      <div className="banner-accent" />
      <div className="welcome-left">
        <div className="welcome-greeting">Command Centre</div>
        <h1 className="welcome-name">
          Dominate every match<br />
          with <span className="highlight">{APP_NAME}.</span>
        </h1>
        <p className="welcome-sub">
          Undetectable mods. Instant key delivery. 24/7 uptime. Your session is active and all systems are operational — ready to haunt the leaderboard?
        </p>
        <div className="welcome-actions">
          <Link href="/register" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Get Started Free</span>
          </Link>
          <Link href="/login" className="btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Sign In</span>
          </Link>
        </div>
      </div>

      <div className="welcome-metrics">
        <div className="metric-pill">
          <span className="metric-val cyan">{activeUsers}</span>
          <span className="metric-lbl">Active Users</span>
        </div>
        <div className="metric-pill">
          <span className="metric-val gold">{totalKeys}</span>
          <span className="metric-lbl">Keys Issued</span>
        </div>
        <div className="metric-pill">
          <span className="metric-val green">{uptime}</span>
          <span className="metric-lbl">Uptime</span>
        </div>
        <div className="metric-pill">
          <span className="metric-val purple">{countries}</span>
          <span className="metric-lbl">Countries</span>
        </div>
      </div>
    </section>
  );
}
