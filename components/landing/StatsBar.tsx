'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { ShieldCheck, Zap, Download, Users } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: <ShieldCheck className="size-5" />, value: '5K+', label: 'Active Users', color: 'oklch(0.7 0.2 145)' },
  { icon: <Zap className="size-5" />, value: '50K+', label: 'Keys Generated', color: 'oklch(0.6 0.2 250)' },
  { icon: <Download className="size-5" />, value: '100K+', label: 'Downloads', color: 'oklch(0.6 0.2 300)' },
  { icon: <Users className="size-5" />, value: '24/7', label: 'Support', color: 'oklch(0.7 0.18 80)' },
];

export function StatsBar() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      if (!section) return;

      const cards = section.querySelectorAll('.stat-card');
      if (cards.length === 0) return;

      gsap.fromTo(cards,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card bg-[oklch(0.08_0_0)] p-6 sm:p-8 flex flex-col items-center text-center gap-3"
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</span>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
