'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { UserPlus, KeyRound, Gamepad2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: <UserPlus className="size-6" />,
    title: 'Create Account',
    description: 'Sign up in seconds. No complicated setup, just your username and you\'re ready to go.',
    accent: 'oklch(0.6 0.2 250)',
  },
  {
    icon: <KeyRound className="size-6" />,
    title: 'Get Your Key',
    description: 'Generate a free trial key or purchase a premium license from our store. Instant delivery guaranteed.',
    accent: 'oklch(0.6 0.2 300)',
  },
  {
    icon: <Gamepad2 className="size-6" />,
    title: 'Dominate',
    description: 'Launch the mod, activate your key, and experience the game like never before with full features unlocked.',
    accent: 'oklch(0.7 0.2 145)',
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
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      const cards = section.querySelectorAll('.step-card');
      if (cards.length === 0) return;

      gsap.fromTo(cards,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
          How It Works
        </h2>
        <p className="text-center mb-16 max-w-lg mx-auto" style={{ color: 'var(--landing-text-muted)' }}>
          Get started in three simple steps and transform your gaming experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting lines */}
          <div
            className="hidden md:block absolute top-16 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
            style={{ background: 'linear-gradient(to right, transparent, var(--step-line), transparent)' }}
          />

          {steps.map((step, i) => (
            <div key={i} className="step-card flex flex-col items-center text-center gap-4">
              <div
                className="relative size-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${step.accent}15`, border: `1px solid ${step.accent}30` }}
              >
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-20"
                  style={{ background: step.accent }}
                />
                <span style={{ color: step.accent }}>{step.icon}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${step.accent}20`, color: step.accent }}
                >
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--landing-text-muted)' }}>{step.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              "hero-cta-primary rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
            )}
          >
            Get Started Now
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
