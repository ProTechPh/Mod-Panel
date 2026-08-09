'use client';

import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants/app';

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <Link href="/" className="topnav-brand">
          <Image
            src="/logo.jpg"
            alt={APP_NAME}
            width={28}
            height={28}
            unoptimized
            priority
            className="topnav-logo"
          />
          <span className="topnav-brand-name">{APP_NAME}</span>
        </Link>
      </div>

      <nav className="topnav-right">
        <Link href="/login" className="topnav-link">
          Sign In
        </Link>
        <Link href="/register" className="topnav-button">
          Get Started
        </Link>
      </nav>
    </header>
  );
}
