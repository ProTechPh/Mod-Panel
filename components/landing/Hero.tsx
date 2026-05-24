'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { APP_NAME } from '@/lib/constants/app';
import { ScrollIndicator } from './ScrollIndicator';
import { ShieldCheck, Users, Zap, Sparkles } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const title = titleRef.current;
      const container = containerRef.current;
      const tagline = taglineRef.current;
      const cta = ctaRef.current;
      const badge = badgeRef.current;
      if (!title || !container || !tagline || !cta || !badge) return;

      const text = title.textContent || '';
      title.innerHTML = text
        .split('')
        .map(char =>
          char === ' '
            ? '<span class="inline-block w-[0.3em]">&nbsp;</span>'
            : `<span class="inline-block">${char}</span>`
        )
        .join('');
      const letters = title.querySelectorAll('span');
      if (letters.length === 0) return;
      const ctaButtons = Array.from(cta.querySelectorAll('a'));

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(badge,
        { y: 20, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 }
      )
        .fromTo(letters,
          { y: 60, opacity: 0, rotationX: -90 },
          { y: 0, opacity: 1, rotationX: 0, stagger: 0.03, duration: 0.7 },
          '-=0.2'
        )
        .fromTo(tagline,
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          '-=0.2'
        );

      if (ctaButtons.length > 0) {
        tl.fromTo(
          ctaButtons,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.5 },
          '-=0.2'
        );
      }

      gsap.to(container, {
        y: -80,
        scale: 0.96,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen min-h-[100svh] flex flex-col items-center justify-center px-4 overflow-hidden"
    >
      {/* Grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(var(--grid-line) 1px, transparent 1px),
              linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Decorative gradient glow top-right */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.04] dark:opacity-[0.06]" style={{ background: 'oklch(0.5 0.2 270)', filter: 'blur(120px)' }} />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-[0.03] dark:opacity-[0.05]" style={{ background: 'oklch(0.6 0.15 200)', filter: 'blur(120px)' }} />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Trust badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full glass-card mb-8"
        >
          <ShieldCheck className="size-4 text-emerald-500" />
          <span className="text-xs font-medium" style={{ color: 'var(--landing-text-muted)' }}>
            Trusted by <span className="text-emerald-500 font-semibold">5,000+</span> gamers worldwide
          </span>
        </div>

        {/* Main title */}
        <h1
          ref={titleRef}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none"
          style={{ perspective: '600px' }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(to bottom, var(--hero-gradient-from), var(--hero-gradient-to))',
            }}
          >
            {APP_NAME}
          </span>
        </h1>

        {/* Tagline */}
        <div className="mt-6 space-y-2">
          <p
            ref={taglineRef}
            className="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--landing-text-muted)' }}
          >
            Dominate every match with undetectable mods. Instant activation, zero compromises, and a growing community of elite players.
          </p>
        </div>

        {/* CTA buttons */}
        <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="hero-cta-primary inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 min-w-[180px]"
          >
            <Zap className="size-4" />
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold glass-card transition-all hover:scale-105 active:scale-95 min-w-[180px]"
            style={{ color: 'var(--landing-text-muted)' }}
          >
            <Users className="size-4" />
            Sign In
          </Link>
        </div>

        {/* Features strip */}
        <div className="mt-14 flex items-center justify-center gap-8 sm:gap-12 flex-wrap" style={{ color: 'var(--landing-text-subtle)' }}>
          <div className="flex items-center gap-2.5 text-xs">
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.7 0.2 145 / 10%)' }}>
              <ShieldCheck className="size-4 text-emerald-500" />
            </div>
            <div className="text-left">
              <span className="block font-medium" style={{ color: 'var(--landing-text)' }}>Undetectable</span>
              <span className="block" style={{ color: 'var(--landing-text-subtle)' }}>Stay under the radar</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.6 0.2 250 / 10%)' }}>
              <Zap className="size-4 text-blue-500" />
            </div>
            <div className="text-left">
              <span className="block font-medium" style={{ color: 'var(--landing-text)' }}>Instant Delivery</span>
              <span className="block" style={{ color: 'var(--landing-text-subtle)' }}>Get keys immediately</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.7 0.18 80 / 10%)' }}>
              <Sparkles className="size-4 text-amber-500" />
            </div>
            <div className="text-left">
              <span className="block font-medium" style={{ color: 'var(--landing-text)' }}>24/7 Support</span>
              <span className="block" style={{ color: 'var(--landing-text-subtle)' }}>We&apos;re here to help</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
