'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import {
  Eye, Crosshair, Target, CircleDot, Package,
  Brain, MoveUp, Settings
} from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

interface FeatureItem {
  name: string;
  description: string;
  icon: React.ReactNode;
  size: 'large' | 'small';
}

const FEATURES: FeatureItem[] = [
  { name: 'ESP', description: 'See through walls with advanced overlay rendering', icon: <Eye className="size-5" />, size: 'large' },
  { name: 'Aim', description: 'Precision targeting with customizable assist settings', icon: <Target className="size-5" />, size: 'large' },
  { name: 'Silent Aim', description: 'Undetectable targeting that keeps you under the radar', icon: <Crosshair className="size-5" />, size: 'large' },
  { name: 'Bullet Track', description: 'Smart bullet trajectory prediction and correction', icon: <CircleDot className="size-5" />, size: 'small' },
  { name: 'Item', description: 'Enhanced loot visibility and item highlighting', icon: <Package className="size-5" />, size: 'small' },
  { name: 'Memory', description: 'Direct memory access for reading game state data', icon: <Brain className="size-5" />, size: 'small' },
  { name: 'Floating', description: 'Customizable floating overlay with live info panels', icon: <MoveUp className="size-5" />, size: 'small' },
  { name: 'Setting', description: 'Full configuration panel for all mod parameters', icon: <Settings className="size-5" />, size: 'small' },
];

function FeatureCard({ feature, index }: { feature: FeatureItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = cardRef.current;
    if (!el) return;

    gsap.from(el, {
      y: 60,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      delay: index * 0.08,
    });

    const xSet = gsap.quickTo(el, 'rotateY', { duration: 0.2, ease: 'power2.out' });
    const ySet = gsap.quickTo(el, 'rotateX', { duration: 0.2, ease: 'power2.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      xSet(x * 8);
      ySet(-y * 8);
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
      className={`tilt-card glass-card rounded-xl p-6 ${sizeClass}`}
      style={{ perspective: '800px' }}
    >
      <div className="tilt-card-inner flex flex-col gap-3">
        <div className="text-muted-foreground">{feature.icon}</div>
        <h3 className="text-base font-semibold">{feature.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
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

    gsap.from(title, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: sectionRef });

  const heroFeatures = FEATURES.filter(f => f.size === 'large');
  const smallFeatures = FEATURES.filter(f => f.size === 'small');

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16">
          Features
        </h2>

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