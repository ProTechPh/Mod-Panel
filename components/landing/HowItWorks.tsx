'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { UserPlus, KeyRound, Gamepad2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: <UserPlus className="size-7" />,
    title: 'Create Account',
    description: 'Sign up in seconds — just a username and you\'re in. No email verification, no waiting.',
    accent: '#60a5fa',
  },
  {
    icon: <KeyRound className="size-7" />,
    title: 'Get Your Key',
    description: 'Generate a free trial or buy premium. Instant delivery straight to your dashboard.',
    accent: '#c084fc',
  },
  {
    icon: <Gamepad2 className="size-7" />,
    title: 'Start Dominating',
    description: 'Launch the mod, activate your key, and experience the game at a whole new level.',
    accent: '#4ade80',
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      if (!section) return;
      const title = section.querySelector('.section-title');
      if (title) {
        gsap.fromTo(title,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' } }
        );
      }
      const cards = section.querySelectorAll('.step-card');
      if (cards.length === 0) return;
      gsap.fromTo(cards,
        { y: 60, opacity: 0, scale: 0.9, rotateX: 10 },
        {
          y: 0, opacity: 1, scale: 1, rotateX: 0,
          stagger: 0.15, duration: 0.7, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative py-28 px-4">
      <div className="section-divider max-w-4xl mx-auto mb-20" />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glow-card mb-6 group">
            <Sparkles className="size-4 text-emerald-500 transition-transform group-hover:rotate-12" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--landing-text-muted)' }}>
              <span className="text-emerald-500">●</span> Quick Start
            </span>
          </div>
          <h2 className="section-title text-4xl sm:text-5xl font-black tracking-tight">
            Get Started in{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">3 Simple Steps</span>
          </h2>
          <p className="mt-4 max-w-lg mx-auto" style={{ color: 'var(--landing-text-muted)' }}>
            No complicated setup. No technical knowledge required. Just pure domination.
          </p>
        </div>

        <div className="relative">
          {/* Connecting path */}
          <svg className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-2 pointer-events-none" style={{ color: 'var(--step-line)' }}>
            <line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, i) => (
              <div key={i} className="step-card flex flex-col items-center text-center gap-5 group">
                {/* Step number */}
                <div className="relative">
                  <div
                    className="size-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                    style={{ background: `${step.accent}12`, border: `1px solid ${step.accent}25` }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                      style={{ background: step.accent }}
                    />
                    <span style={{ color: step.accent }}>{step.icon}</span>
                  </div>
                  {/* Step counter */}
                  <div
                    className="absolute -top-2 -right-2 size-7 rounded-full flex items-center justify-center text-xs font-black border-2 shadow-lg"
                    style={{ background: step.accent, borderColor: 'var(--landing-bg)', color: 'white' }}
                  >
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--landing-text-muted)' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-16">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-3 rounded-full px-10 py-4 text-sm font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/45"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              Start Your Journey
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
