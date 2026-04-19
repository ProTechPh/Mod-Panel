'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants/app';
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

      gsap.set(ctaButtons, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(letters, {
        y: 40,
        opacity: 0,
        rotationX: -90,
        stagger: 0.04,
        duration: 0.8,
      })
        .from(tagline, { y: 20, opacity: 0, duration: 0.6 }, '-=0.3');

      if (ctaButtons.length > 0) {
        tl.from(
          ctaButtons,
          {
            y: 30,
            autoAlpha: 0,
            stagger: 0.1,
            duration: 0.5,
            immediateRender: false,
            clearProps: 'opacity,visibility,transform',
          },
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
          Premium game mod management. Secure keys, real-time status, seamless downloads.
        </p>

        <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: 'lg' }), 'min-w-36')}
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-w-36')}
          >
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}