'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import {
  Eye, Crosshair, Target, CircleDot, Package,
  Brain, MoveUp, Settings, Sparkles
} from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

interface FeatureItem {
  name: string;
  description: string;
  icon: React.ReactNode;
  size: 'large' | 'small';
  accent: string;
}

const FEATURES: FeatureItem[] = [
  { name: 'ESP', description: 'See through walls with advanced overlay rendering', icon: <Eye className="size-5" />, size: 'large', accent: '#4ade80' },
  { name: 'Aim', description: 'Precision targeting with customizable assist settings', icon: <Target className="size-5" />, size: 'large', accent: '#f87171' },
  { name: 'Silent Aim', description: 'Undetectable targeting that keeps you under the radar', icon: <Crosshair className="size-5" />, size: 'large', accent: '#c084fc' },
  { name: 'Bullet Track', description: 'Smart bullet trajectory prediction and correction', icon: <CircleDot className="size-5" />, size: 'small', accent: '#60a5fa' },
  { name: 'Item', description: 'Enhanced loot visibility and item highlighting', icon: <Package className="size-5" />, size: 'small', accent: '#fbbf24' },
  { name: 'Memory', description: 'Direct memory access for reading game state data', icon: <Brain className="size-5" />, size: 'small', accent: '#a78bfa' },
  { name: 'Floating', description: 'Customizable floating overlay with live info panels', icon: <MoveUp className="size-5" />, size: 'small', accent: '#2dd4bf' },
  { name: 'Setting', description: 'Full configuration panel for all mod parameters', icon: <Settings className="size-5" />, size: 'small', accent: '#94a3b8' },
];

function FeatureCard({ feature, index }: { feature: FeatureItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = cardRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    gsap.fromTo(el,
      { y: 60, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        delay: index * 0.08,
      }
    );

    const xSet = gsap.quickTo(inner, 'rotationY', { duration: 0.2, ease: 'power2.out' });
    const ySet = gsap.quickTo(inner, 'rotationX', { duration: 0.2, ease: 'power2.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      xSet(x * 10);
      ySet(-y * 10);
    };

    const handleMouseLeave = () => {
      xSet(0);
      ySet(0);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, { scope: cardRef });

  const sizeClass = feature.size === 'large'
    ? 'md:col-span-1 md:row-span-1'
    : 'md:col-span-1';

  return (
    <div
      ref={cardRef}
      className={`tilt-card glass-card rounded-xl p-6 ${sizeClass} group`}
      style={{ perspective: '800px' }}
    >
      <div className="tilt-card-inner flex flex-col gap-3" ref={innerRef}>
        <div className="flex items-center gap-3">
          <div className="feature-icon-glow" style={{ '--accent-color': feature.accent } as React.CSSProperties}>
            <div className="feature-icon-bg" style={{ backgroundColor: feature.accent + '15' }}>
              <span style={{ color: feature.accent }}>{feature.icon}</span>
            </div>
          </div>
          <h3 className="text-base font-semibold">{feature.name}</h3>
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
  }, { scope: sectionRef });

  const heroFeatures = FEATURES.filter(f => f.size === 'large');
  const smallFeatures = FEATURES.filter(f => f.size === 'small');

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-6">
            <Sparkles className="size-3.5 text-purple-500" />
            <span className="text-xs font-medium" style={{ color: 'var(--landing-text-muted)' }}>Premium Features</span>
          </div>
          <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight">
            Everything You Need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400">Dominate</span>
          </h2>
          <p className="mt-3 max-w-xl mx-auto" style={{ color: 'var(--landing-text-muted)' }}>
            A comprehensive suite of undetectable mods designed for competitive players who demand the best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {heroFeatures.map((feature, i) => (
            <FeatureCard key={feature.name} feature={feature} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {smallFeatures.map((feature, i) => (
            <FeatureCard key={feature.name} feature={feature} index={heroFeatures.length + i} />
          ))}
        </div>
      </div>
    </section>
  );
}
