'use client';

import Link from 'next/link';
import { ShoppingBag, LogIn, Download, Headphones } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="quick-actions-section">
      <div className="section-header">
        <span className="section-label">QUICK LINKS</span>
        <h2 className="section-title">Quick Actions</h2>
      </div>

      <div className="quick-actions-grid">
        <a href="https://t.me/CanKillYouForever" target="_blank" rel="noopener noreferrer" className="quick-action-card">
          <ShoppingBag size={20} />
          <span className="quick-action-label">Buy Keys</span>
        </a>
        <Link href="/login" className="quick-action-card">
          <LogIn size={20} />
          <span className="quick-action-label">Sign In</span>
        </Link>
        <a href="#downloads" className="quick-action-card">
          <Download size={20} />
          <span className="quick-action-label">Downloads</span>
        </a>
        <a href="https://t.me/CanKillYouForever" target="_blank" rel="noopener noreferrer" className="quick-action-card">
          <Headphones size={20} />
          <span className="quick-action-label">Support</span>
        </a>
      </div>
    </div>
  );
}
