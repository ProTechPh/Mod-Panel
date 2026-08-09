'use client';

import Link from 'next/link';
import { ShoppingBag, LogIn, Download, Headphones, Radio } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="panel fade-up d3">
      <div className="panel-head">
        <h2 className="panel-title">
          <Radio size={14} className="text-orange-500 animate-pulse" />
          <span>Operator Hotlinks</span>
        </h2>
        <span className="panel-badge">ONLINE</span>
      </div>

      <div className="quick-actions">
        <a href="https://t.me/CanKillYouForever" target="_blank" rel="noopener noreferrer" className="qa-btn">
          <div className="qa-icon">
            <ShoppingBag size={18} />
          </div>
          <span className="qa-label">Buy Keys</span>
        </a>
        <Link href="/login" className="qa-btn">
          <div className="qa-icon">
            <LogIn size={18} />
          </div>
          <span className="qa-label">Sign In</span>
        </Link>
        <a href="#downloads" className="qa-btn">
          <div className="qa-icon">
            <Download size={18} />
          </div>
          <span className="qa-label">Downloads</span>
        </a>
        <a href="https://t.me/CanKillYouForever" target="_blank" rel="noopener noreferrer" className="qa-btn">
          <div className="qa-icon">
            <Headphones size={18} />
          </div>
          <span className="qa-label">Support</span>
        </a>
      </div>
    </div>
  );
}
