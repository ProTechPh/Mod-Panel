'use client';

import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants/app';
import '@/components/landing/landing.css';

export function TopNav() {
  return (
    <header className="gs-topnav">
      <div className="nav-left">
        <Link href="/" className="nav-brand">
          <Image
            src="/logo.jpg"
            alt={APP_NAME}
            width={32}
            height={32}
            unoptimized
            priority
            className="nav-brand-logo"
          />
          <span className="nav-brand-text">{APP_NAME}</span>
        </Link>
      </div>

      <div className="nav-right">
        <div className="nav-status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </div>
        <Link href="/login" className="nav-btn nav-btn-outline">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Sign In
        </Link>
        <Link href="/register" className="nav-btn nav-btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Get Started
        </Link>
      </div>
    </header>
  );
}
