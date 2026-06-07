'use client';

import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants/app';
import { Send } from 'lucide-react';
import '@/components/landing/landing.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="gs-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">
            <Image
              src="/logo.jpg"
              alt={APP_NAME}
              width={32}
              height={32}
              unoptimized
              className="nav-brand-logo"
            />
            <span className="footer-brand-text">{APP_NAME}</span>
          </div>
          <p className="footer-tag">
            Undetectable game mods. Instant key delivery. 24/7 uptime. Dominate every match with our elite mod suite.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Store</div>
          <Link href="/register" className="footer-link">Get Started</Link>
          <Link href="/login" className="footer-link">Sign In</Link>
          <a href="#downloads" className="footer-link">Downloads</a>
          <a href="#features" className="footer-link">Modules</a>
        </div>

        <div>
          <div className="footer-col-title">Resources</div>
          <a href="#how-it-works" className="footer-link">Quick Start</a>
          <a href="#status" className="footer-link">System Status</a>
          <a href="#streamers" className="footer-link">Streamers</a>
          <a
            href="https://t.me/CanKillYouForever"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <Send size={12} /> Telegram
          </a>
        </div>

        <div>
          <div className="footer-col-title">Legal</div>
          <Link href="/store-terms" className="footer-link">Terms of Service</Link>
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#refund" className="footer-link">Refund Policy</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} {APP_NAME} · All rights reserved</span>
        <span>Build <span className="version">v3.2</span> · Operational</span>
      </div>
    </footer>
  );
}
