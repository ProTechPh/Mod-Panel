'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { APP_NAME } from '@/lib/constants/app';
import { ScrollIndicator } from './ScrollIndicator';
import { ShieldCheck, Users, Zap, Sparkles, ChevronRight, ArrowRight, Star } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

const words = ['Dominate', 'Win', 'Conquer', 'Destroy'];

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const floatingOrbsRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const [wordIndex, setWordIndex] = useState(0);

  // Typewriter effect
  useEffect(() => {
    const el = typewriterRef.current;
    if (!el) return;
    let currentIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const tick = () => {
      const currentWord = words[wordIndex];
      if (!isDeleting) {
        el.textContent = currentWord.slice(0, currentIndex + 1);
        currentIndex++;
        if (currentIndex === currentWord.length) {
          timeout = setTimeout(() => { isDeleting = true; tick(); }, 2000);
          return;
        }
        timeout = setTimeout(tick, 80);
      } else {
        el.textContent = currentWord.slice(0, currentIndex - 1);
        currentIndex--;
        if (currentIndex === 0) {
          isDeleting = false;
          setWordIndex(i => (i + 1) % words.length);
          return;
        }
        timeout = setTimeout(tick, 40);
      }
    };

    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, [wordIndex]);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const title = titleRef.current;
      const container = containerRef.current;
      const tagline = taglineRef.current;
      const cta = ctaRef.current;
      const badge = badgeRef.current;
      const orbs = floatingOrbsRef.current;
      if (!title || !container || !tagline || !cta || !badge || !orbs) return;

      // Floating orbs animation
      const orbEls = orbs.querySelectorAll('.hero-float-orb');
      orbEls.forEach((orb, i) => {
        gsap.to(orb, {
          y: i % 2 === 0 ? -30 : 30,
          x: i % 3 === 0 ? 20 : -20,
          rotation: i * 30,
          duration: 3 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3,
        });
      });

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
        { y: 30, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7 }
      )
        .fromTo(letters,
          { y: 80, opacity: 0, rotationX: -90, scale: 0.5 },
          { y: 0, opacity: 1, rotationX: 0, scale: 1, stagger: 0.02, duration: 0.6 },
          '-=0.3'
        )
        .fromTo(tagline,
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5 },
          '-=0.2'
        );

      if (ctaButtons.length > 0) {
        tl.fromTo(
          ctaButtons,
          { y: 40, autoAlpha: 0, scale: 0.9 },
          { y: 0, autoAlpha: 1, scale: 1, stagger: 0.12, duration: 0.5 },
          '-=0.2'
        );
      }

      // Parallax scroll
      gsap.to(container, {
        y: -100,
        scale: 0.95,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });

      // Floating orbs parallax
      gsap.to(orbs, {
        y: 60,
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
      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 animate-grid-pan"
          style={{
            backgroundImage: `
              linear-gradient(var(--grid-line) 1px, transparent 1px),
              linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating orbs */}
      <div ref={floatingOrbsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-float-orb absolute top-[15%] left-[10%] size-32 rounded-full opacity-[0.04] dark:opacity-[0.07]" style={{ background: 'oklch(0.5 0.3 270)', filter: 'blur(40px)' }} />
        <div className="hero-float-orb absolute top-[60%] right-[8%] size-48 rounded-full opacity-[0.03] dark:opacity-[0.06]" style={{ background: 'oklch(0.6 0.2 200)', filter: 'blur(50px)' }} />
        <div className="hero-float-orb absolute top-[30%] right-[20%] size-24 rounded-full opacity-[0.04] dark:opacity-[0.08]" style={{ background: 'oklch(0.4 0.25 300)', filter: 'blur(35px)' }} />
        <div className="hero-float-orb absolute bottom-[20%] left-[20%] size-40 rounded-full opacity-[0.03] dark:opacity-[0.05]" style={{ background: 'oklch(0.65 0.2 150)', filter: 'blur(45px)' }} />
      </div>

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Corner decorative accents */}
      <div className="absolute top-8 left-8 size-12 border-l-2 border-t-2 border-emerald-500/20 rounded-tl-xl" />
      <div className="absolute top-8 right-8 size-12 border-r-2 border-t-2 border-purple-500/20 rounded-tr-xl" />
      <div className="absolute bottom-8 left-8 size-12 border-l-2 border-b-2 border-blue-500/20 rounded-bl-xl" />
      <div className="absolute bottom-8 right-8 size-12 border-r-2 border-b-2 border-pink-500/20 rounded-br-xl" />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Trust badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full glass-card mb-8 group hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
        >
          <div className="relative">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span className="absolute -top-1 -right-1 size-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--landing-text-muted)' }}>
            Trusted by <span className="text-emerald-500 font-bold text-sm">15,000+</span> gamers worldwide
          </span>
          <span className="flex -space-x-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="size-5 rounded-full border-2 border-background bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                <Star className="size-2.5 text-white" />
              </span>
            ))}
          </span>
        </div>

        {/* Badge strip */}
        <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'oklch(0.7 0.2 145 / 10%)', color: 'oklch(0.6 0.2 145)', border: '1px solid oklch(0.7 0.2 145 / 20%)' }}>
            <Sparkles className="size-3" /> New Update v3.2
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'oklch(0.6 0.2 250 / 10%)', color: 'oklch(0.6 0.2 250)', border: '1px solid oklch(0.6 0.2 250 / 20%)' }}>
            <Zap className="size-3" /> 100% Undetectable
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider animate-pulse" style={{ background: 'oklch(0.6 0.2 300 / 10%)', color: 'oklch(0.6 0.2 300)', border: '1px solid oklch(0.6 0.2 300 / 20%)' }}>
            <Users className="size-3" /> Live Now
          </span>
        </div>

        {/* Main title */}
        <h1
          ref={titleRef}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-4"
          style={{ perspective: '800px' }}
        >
          <span
            className="bg-clip-text text-transparent animate-gradient-shift"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--hero-gradient-from), oklch(0.6 0.2 250), oklch(0.6 0.2 300), var(--hero-gradient-to))',
              backgroundSize: '300% 300%',
            }}
          >
            {APP_NAME}
          </span>
        </h1>

        {/* Typewriter subtitle */}
        <div className="h-12 flex items-center justify-center gap-2">
          <span className="text-lg sm:text-xl font-semibold">Ready to</span>
          <span
            ref={typewriterRef}
            className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 min-w-[80px] inline-block text-left"
          />
          <span className="inline-block w-0.5 h-6 bg-emerald-500 animate-pulse" />
        </div>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed mt-2"
          style={{ color: 'var(--landing-text-muted)' }}
        >
          Dominate every match with undetectable mods. Instant activation, zero compromises, and a growing community of elite players.
        </p>

        {/* CTA buttons */}
        <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-10 py-4 text-sm font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 min-w-[200px] shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              <Zap className="size-4" />
              Get Started Free
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-sm font-semibold glass-card transition-all duration-300 hover:scale-105 active:scale-95 min-w-[200px]"
            style={{ color: 'var(--landing-text-muted)' }}
          >
            <Users className="size-4" />
            Sign In
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Animated feature badges */}
        <div className="mt-14 flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          <div className="flex items-center gap-3 text-xs group">
            <div className="relative size-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: 'oklch(0.7 0.2 145 / 10%)' }}>
              <ShieldCheck className="size-5 text-emerald-500" />
              <span className="absolute -top-1 -right-1 size-2.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm" style={{ color: 'var(--landing-text)' }}>Undetectable</span>
              <span className="block text-xs" style={{ color: 'var(--landing-text-subtle)' }}>Military-grade bypass</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs group">
            <div className="relative size-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: 'oklch(0.6 0.2 250 / 10%)' }}>
              <Zap className="size-5 text-blue-500" />
              <span className="absolute -top-1 -right-1 size-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm" style={{ color: 'var(--landing-text)' }}>Instant Delivery</span>
              <span className="block text-xs" style={{ color: 'var(--landing-text-subtle)' }}>Keys in seconds</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs group">
            <div className="relative size-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: 'oklch(0.7 0.18 80 / 10%)' }}>
              <Sparkles className="size-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 size-2.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm" style={{ color: 'var(--landing-text)' }}>24/7 Support</span>
              <span className="block text-xs" style={{ color: 'var(--landing-text-subtle)' }}>We never sleep</span>
            </div>
          </div>
        </div>

        {/* Scrolling trust bar */}
        <div className="mt-10 pt-6 border-t border-emerald-500/10">
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-semibold overflow-hidden" style={{ color: 'var(--landing-text-subtle)' }}>
            <span className="animate-pulse">✦ As seen on</span>
            <span className="opacity-40">—</span>
            <span>ProPlayers</span>
            <span className="opacity-30">•</span>
            <span>GamingHub</span>
            <span className="opacity-30">•</span>
            <span>ModCentral</span>
            <span className="opacity-30">•</span>
            <span>EliteGamers</span>
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
