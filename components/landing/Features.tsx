'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import {
  Eye, Crosshair, Target, CircleDot, Package,
  Brain, MoveUp, Settings, Sparkles, Zap, Shield
} from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: <Eye className="size-5" />, name: 'ESP', description: 'See through walls with advanced overlay rendering. Real-time player detection up to 300m.', accent: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
  { icon: <Target className="size-5" />, name: 'Aim', description: 'Precision targeting with customizable FOV, smoothness, and hitbox selection.', accent: '#f87171', glow: 'rgba(248,113,113,0.15)' },
  { icon: <Crosshair className="size-5" />, name: 'Silent Aim', description: 'Undetectable targeting that keeps you under the radar. No suspicious movement patterns.', accent: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
  { icon: <CircleDot className="size-5" />, name: 'Bullet Track', description: 'Smart trajectory prediction with auto-leading and drop compensation.', accent: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
  { icon: <Package className="size-5" />, name: 'Item', description: 'Enhanced loot visibility with rarity coloring and distance filtering.', accent: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
  { icon: <Brain className="size-5" />, name: 'Memory', description: 'Direct memory access for reading game state. Bypass detection with kernel-level hooks.', accent: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  { icon: <MoveUp className="size-5" />, name: 'Floating', description: 'Customizable HUD overlay with live stats, minimap, and enemy tracking.', accent: '#2dd4bf', glow: 'rgba(45,212,191,0.15)' },
  { icon: <Settings className="size-5" />, name: 'Settings', description: 'Full configuration panel. Save profiles, hot-switch between setups instantly.', accent: '#94a3b8', glow: 'rgba(148,163,184,0.15)' },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = cardRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    gsap.fromTo(el,
      { y: 70, opacity: 0, scale: 0.9, rotateX: 10 },
      {
        y: 0, opacity: 1, scale: 1, rotateX: 0,
        duration: 0.7,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        delay: index * 0.08,
      }
    );

    const xSet = gsap.quickTo(inner, 'rotationY', { duration: 0.15, ease: 'power2.out' });
    const ySet = gsap.quickTo(inner, 'rotationX', { duration: 0.15, ease: 'power2.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      xSet(x * 12);
      ySet(-y * 12);
    };
    const handleMouseLeave = () => { xSet(0); ySet(0); };
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className="tilt-card glow-card rounded-xl p-6 group relative overflow-hidden"
      style={{ perspective: '800px' }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
        style={{ boxShadow: `inset 0 0 60px ${feature.glow}` }}
      />
      <div className="tilt-card-inner flex flex-col gap-3 relative z-10" ref={innerRef}>
        <div className="flex items-center gap-3">
          <div className="feature-icon-glow" style={{ '--accent-color': feature.accent } as React.CSSProperties}>
            <div className="feature-icon-bg" style={{ backgroundColor: feature.accent + '15' }}>
              <span style={{ color: feature.accent }}>{feature.icon}</span>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold">{feature.name}</h3>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--landing-text-muted)' }}>{feature.description}</p>
      </div>
    </div>
  );
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const title = section.querySelector('.section-title');
    if (!title) return;
    gsap.fromTo(title,
      { y: 40, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative py-28 px-4">
      <div className="section-divider max-w-5xl mx-auto mb-20" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glow-card mb-6 group">
            <Sparkles className="size-4 text-purple-500 transition-transform group-hover:rotate-12" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--landing-text-muted)' }}>
              <span className="text-purple-500">●</span> Premium Arsenal
            </span>
          </div>
          <h2 className="section-title text-4xl sm:text-5xl font-black tracking-tight">
            Everything You Need to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400">Dominate</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-sm" style={{ color: 'var(--landing-text-muted)' }}>
            A comprehensive suite of undetectable mods engineered for competitive players who demand nothing but the best.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--landing-text-subtle)' }}>
              <Shield className="size-3 text-emerald-500" /> Anti-Ban
            </span>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--landing-text-subtle)' }}>
              <Zap className="size-3 text-blue-500" /> Low Latency
            </span>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--landing-text-subtle)' }}>
              <Settings className="size-3 text-purple-500" /> Fully Customizable
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.name} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
