'use client';

import Link from 'next/link';
import { APP_NAME } from '@/lib/constants/app';
import { ArrowRight, LogIn } from 'lucide-react';

interface HeroProps {
  activeUsers: string;
  totalKeys: string;
  uptime: string;
  countries: string;
}

export function Hero({ activeUsers, totalKeys, uptime, countries }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Professional tools for <span className="hero-accent">{APP_NAME}</span>
        </h1>
        <p className="hero-subtitle">
          Reliable mod management platform with instant key delivery, real-time status monitoring, and enterprise-grade uptime. Built for performance, designed for reliability.
        </p>
        <div className="hero-actions">
          <Link href="/register" className="hero-btn-primary">
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="hero-btn-secondary">
            Sign In
            <LogIn size={16} />
          </Link>
        </div>
      </div>

      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">{activeUsers}</span>
          <span className="hero-stat-label">Active Users</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{totalKeys}</span>
          <span className="hero-stat-label">Keys Issued</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{uptime}</span>
          <span className="hero-stat-label">Uptime</span>
        </div>
      </div>
    </section>
  );
}
