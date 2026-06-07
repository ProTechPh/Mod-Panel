'use client';

import Link from 'next/link';
import { Zap, Plus, ShoppingBag, Headphones, Download } from 'lucide-react';
import '@/components/landing/landing.css';

export function QuickActions() {
  return (
    <div className="panel fade-up d3 panel-corner">
      <div className="panel-head">
        <div className="panel-title">
          <Zap className="ico" size={16} />
          Quick Actions
        </div>
      </div>

      <div className="quick-actions">
        <Link href="/register" className="qa-btn">
          <div className="qa-icon" style={{ background: 'rgba(20, 184, 184, 0.1)', color: 'var(--teal-2)' }}>
            <ShoppingBag size={16} />
          </div>
          <span className="qa-label">Buy Keys</span>
        </Link>
        <Link href="/login" className="qa-btn">
          <div className="qa-icon" style={{ background: 'rgba(240, 192, 64, 0.1)', color: 'var(--gold)' }}>
            <Plus size={16} />
          </div>
          <span className="qa-label">Sign In</span>
        </Link>
        <a href="#downloads" className="qa-btn">
          <div className="qa-icon" style={{ background: 'rgba(57, 255, 20, 0.08)', color: 'var(--ecto-green)' }}>
            <Download size={16} />
          </div>
          <span className="qa-label">Downloads</span>
        </a>
        <a href="https://t.me/CanKillYouForever" target="_blank" rel="noopener noreferrer" className="qa-btn">
          <div className="qa-icon" style={{ background: 'rgba(167, 139, 250, 0.08)', color: 'var(--purple)' }}>
            <Headphones size={16} />
          </div>
          <span className="qa-label">Support</span>
        </a>
      </div>
    </div>
  );
}
