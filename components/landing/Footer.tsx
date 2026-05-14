'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { APP_NAME } from '@/lib/constants/app';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const footer = footerRef.current;
    if (!footer) return;

    gsap.fromTo(footer,
      { y: 20, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.5, ease: 'power2.out',
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, { scope: footerRef });

  return (
    <footer
      ref={footerRef}
      className="relative border-t border-white/[0.08] py-12 px-4"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Login
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Register
          </Link>
          <a
            href="https://t.me/CanKillYouForever"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Telegram
          </a>
        </nav>
      </div>
    </footer>
  );
}