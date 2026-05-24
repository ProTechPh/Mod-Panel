'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { ShieldCheck, Zap, Download, TrendingUp, Sparkles } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: <ShieldCheck className="size-5" />, value: '15,000+', label: 'Active Users', desc: 'And growing daily', accent: 'oklch(0.7 0.25 145)', color: '#4ade80' },
  { icon: <Zap className="size-5" />, value: '120,000+', label: 'Keys Generated', desc: '99.9% activation rate', accent: 'oklch(0.6 0.25 250)', color: '#60a5fa' },
  { icon: <Download className="size-5" />, value: '250,000+', label: 'Downloads', desc: 'Across 50+ countries', accent: 'oklch(0.6 0.25 300)', color: '#c084fc' },
  { icon: <TrendingUp className="size-5" />, value: '99.97%', label: 'Uptime', desc: 'Enterprise-grade reliability', accent: 'oklch(0.7 0.22 80)', color: '#fbbf24' },
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
        { y: 60, opacity: 0, scale: 0.9, rotateX: 15 },
        {
          y: 0, opacity: 1, scale: 1, rotateX: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: 'back.out(1.7)',
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
    <section ref={sectionRef} className="relative py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card glow-card rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center gap-3 relative group"
            >
              {/* Glow effect on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl"
                style={{ background: stat.accent }}
              />
              <div
                className="size-12 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                style={{ background: `${stat.accent}15` }}
              >
                <span style={{ color: stat.accent }}>{stat.icon}</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">{stat.value}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: stat.color }}>{stat.label}</span>
                <p className="text-[10px] mt-1" style={{ color: 'var(--landing-text-subtle)' }}>{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
