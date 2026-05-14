'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { APP_NAME } from '@/lib/constants/app';
import { ScrollIndicator } from './ScrollIndicator';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const title = titleRef.current;
      const container = containerRef.current;
      const tagline = taglineRef.current;
      const cta = ctaRef.current;
      if (!title || !container || !tagline || !cta) return;

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

      tl.fromTo(letters,
        { y: 40, opacity: 0, rotationX: -90 },
        { y: 0, opacity: 1, rotationX: 0, stagger: 0.04, duration: 0.8 }
      )
        .fromTo(tagline,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          '-=0.3'
        );

      if (ctaButtons.length > 0) {
        tl.fromTo(
          ctaButtons,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.5 },
          '-=0.3'
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
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1
          ref={titleRef}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none"
          style={{ perspective: '600px' }}
        >
          {APP_NAME}
        </h1>

        <p
          ref={taglineRef}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto"
        >
          Dominate every match. Undetectable mods, instant activation, zero compromises.
        </p>

        <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="hero-cta-primary inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white/80 border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
          >
            Login
          </Link>
        </div>
      </div>
      <ScrollIndicator />
    </section>
  );
}