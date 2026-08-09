'use client';

import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants/app';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Image
            src="/logo.jpg"
            alt={APP_NAME}
            width={24}
            height={24}
            unoptimized
            className="footer-logo"
          />
          <span className="footer-brand-name">{APP_NAME}</span>
        </div>

        <div className="footer-links">
          <Link href="/register" className="footer-link">Get Started</Link>
          <Link href="/login" className="footer-link">Sign In</Link>
          <a href="#downloads" className="footer-link">Downloads</a>
          <a href="#features" className="footer-link">Features</a>
          <Link href="/terms" className="footer-link">Terms</Link>
        </div>

        <div className="footer-copyright">
          © {year} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
