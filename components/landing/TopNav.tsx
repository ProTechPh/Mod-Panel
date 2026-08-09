'use client';

import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants/app';
import { Terminal, Shield } from 'lucide-react';

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <Link href="/" className="topnav-brand" style={{ marginRight: '2rem' }}>
          <Image
            src="/logo.jpg"
            alt={APP_NAME}
            width={24}
            height={24}
            unoptimized
            priority
            className="topnav-logo"
            style={{ border: '1.5px solid var(--teal-2)', boxShadow: '0 0 8px rgba(234, 88, 12, 0.3)' }}
          />
          <span className="topnav-brand-name" style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {APP_NAME}
          </span>
        </Link>

        {/* Client Store/Launcher Tabs */}
        <div className="hidden md:flex items-center gap-1">
          <a href="#store" className="topnav-tab active">
            Store
          </a>
          <a href="#downloads" className="topnav-tab">
            Library
          </a>
          <a href="#downloads" className="topnav-tab">
            Downloads
          </a>
          <Link href="/docs" className="topnav-tab">
            Docs
          </Link>
        </div>
      </div>

      <nav className="topnav-right">
        {/* Latency simulator tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/30 border border-white/5 font-mono text-[10px] text-emerald-400">
          <Terminal size={10} />
          <span>PING: 24ms</span>
        </div>

        <Link href="/login" className="topnav-link text-xs font-semibold uppercase tracking-wider">
          Sign In
        </Link>
        <Link href="/register" className="topnav-button text-xs font-bold uppercase tracking-wider">
          Get Started
        </Link>
      </nav>
    </header>
  );
}
