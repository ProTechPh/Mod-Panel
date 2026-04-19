# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the root redirect with a dark-luxury animated landing page that markets Winter Panel to new users and provides server status + downloads for existing users.

**Architecture:** Single-page client component (`LandingPage.tsx`) composed of 5 section components, all using GSAP + ScrollTrigger for heavy animation choreography. New public API route `/api/server-status` for live status data. All sections force dark mode.

**Tech Stack:** Next.js 16 App Router, GSAP + @gsap/react, ScrollTrigger, shadcn/ui (Button, Badge), Lucide icons, Tailwind CSS v4

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `app/page.tsx` | Server component rendering LandingPage |
| Create | `components/landing/LandingPage.tsx` | Client orchestrator, forces dark, scroll container |
| Create | `components/landing/Hero.tsx` | Hero section with animated title + CTAs |
| Create | `components/landing/Features.tsx` | Bento grid of mod features |
| Create | `components/landing/ServerStatus.tsx` | Live server status panel |
| Create | `components/landing/DownloadSection.tsx` | Download links section |
| Create | `components/landing/Footer.tsx` | Branding + nav links |
| Create | `components/landing/GrainOverlay.tsx` | Noise texture overlay |
| Create | `components/landing/GradientOrbs.tsx` | CSS animated background orbs |
| Create | `hooks/useGsapScroll.ts` | ScrollTrigger registration + cleanup |
| Create | `app/api/server-status/route.ts` | Public API for server status |
| Modify | `proxy.ts:5` | Add `/api/server-status` to API_PUBLIC |
| Create | `components/landing/landing.css` | Landing-specific CSS (grain, orbs, 3D tilt) |

---

### Task 1: Install GSAP Dependencies

**Files:**
- Modify: `package.json` (via pnpm add)

- [ ] **Step 1: Install gsap and @gsap/react**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm add gsap @gsap/react
```

- [ ] **Step 2: Verify installation**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm ls gsap @gsap/react
```

Expected: Both packages listed with versions

- [ ] **Step 3: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add package.json pnpm-lock.yaml && git commit -m "feat: add gsap and @gsap/react dependencies for landing page animations"
```

---

### Task 2: Create the useGsapScroll Hook

**Files:**
- Create: `hooks/useGsapScroll.ts`

This hook registers ScrollTrigger once and provides cleanup on unmount. All animated components will use this.

- [ ] **Step 1: Create the hook file**

```typescript
// hooks/useGsapScroll.ts
'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapScroll() {
  useGSAP(() => {
    ScrollTrigger.refresh();
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, { scope: null });
}

export { gsap, ScrollTrigger };
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm tsc --noEmit --pretty false 2>&1 | head -20
```

Expected: No errors related to `useGsapScroll`

- [ ] **Step 3: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add hooks/useGsapScroll.ts && git commit -m "feat: add useGsapScroll hook for ScrollTrigger lifecycle management"
```

---

### Task 3: Create Landing-Specific CSS

**Files:**
- Create: `components/landing/landing.css`

Contains grain texture, gradient orb animations, 3D tilt helpers, and the section styling.

- [ ] **Step 1: Create the CSS file**

```css
/* components/landing/landing.css */

/* Grain/noise overlay */
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* Gradient orbs */
@keyframes orb-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -50px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(40px, 30px) scale(1.05); }
}

@keyframes orb-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-40px, 30px) scale(0.95); }
  50% { transform: translate(20px, -40px) scale(1.1); }
  75% { transform: translate(-30px, -20px) scale(1); }
}

@keyframes orb-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1.05); }
  33% { transform: translate(50px, 20px) scale(0.9); }
  66% { transform: translate(-30px, -40px) scale(1.1); }
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  will-change: transform;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: oklch(0.5 0.2 270);
  top: -10%;
  left: -5%;
  animation: orb-drift-1 20s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: oklch(0.6 0.15 200);
  bottom: -5%;
  right: -10%;
  animation: orb-drift-2 25s ease-in-out infinite;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: oklch(0.4 0.18 300);
  top: 40%;
  right: 20%;
  animation: orb-drift-3 18s ease-in-out infinite;
}

/* 3D tilt card */
.tilt-card {
  transform-style: preserve-3d;
  perspective: 800px;
}

.tilt-card-inner {
  transition: transform 0.15s ease-out;
  transform-style: preserve-3d;
}

/* Glass card */
.glass-card {
  background: oklch(0.2 0 0 / 50%);
  backdrop-filter: blur(12px);
  border: 1px solid oklch(1 0 0 / 8%);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.glass-card:hover {
  border-color: oklch(1 0 0 / 15%);
  box-shadow: 0 0 30px oklch(0.5 0.2 270 / 10%);
}

/* Status dot pulse */
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.7 0.2 145 / 40%); }
  50% { box-shadow: 0 0 0 6px oklch(0.7 0.2 145 / 0%); }
}

.status-dot-active {
  animation: pulse-dot 2s ease-in-out infinite;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .orb { animation: none; }
  .status-dot-active { animation: none; }
  .tilt-card-inner { transition: none; }
}
```

- [ ] **Step 2: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/landing.css && git commit -m "feat: add landing page CSS with grain overlay, orb animations, and glass cards"
```

---

### Task 4: Create GrainOverlay Component

**Files:**
- Create: `components/landing/GrainOverlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/GrainOverlay.tsx
'use client';

import '@/components/landing/landing.css';

export function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden="true" />;
}
```

- [ ] **Step 2: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/GrainOverlay.tsx && git commit -m "feat: add GrainOverlay component for noise texture"
```

---

### Task 5: Create GradientOrbs Component

**Files:**
- Create: `components/landing/GradientOrbs.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/GradientOrbs.tsx
'use client';

import '@/components/landing/landing.css';

export function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/GradientOrbs.tsx && git commit -m "feat: add GradientOrbs component for background animation"
```

---

### Task 6: Create Hero Component

**Files:**
- Create: `components/landing/Hero.tsx`

This is the most complex component — letter-by-letter title reveal, tagline fade, CTA slide-up, and parallax scroll.

- [ ] **Step 1: Create the component**

```tsx
// components/landing/Hero.tsx
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Button } from '@/components/ui/button';
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
      if (!title) return;

      // Split title into letters
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

      // Animation timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(letters, {
        y: 40,
        opacity: 0,
        rotateX: -90,
        stagger: 0.04,
        duration: 0.8,
      })
        .from(taglineRef.current!, { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
        .from(
          ctaRef.current!.children,
          { y: 30, opacity: 0, stagger: 0.1, duration: 0.5 },
          '-=0.3'
        );

      // Parallax scroll effect
      gsap.to(containerRef.current!, {
        y: -80,
        scale: 0.96,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current!,
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
      className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
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
          <Button size="lg" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm tsc --noEmit --pretty false 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/Hero.tsx && git commit -m "feat: add Hero component with GSAP letter reveal and parallax scroll"
```

---

### Task 7: Create Features Component

**Files:**
- Create: `components/landing/Features.tsx`

Bento grid with staggered scroll reveal and 3D hover tilt.

- [ ] **Step 1: Create the component**

```tsx
// components/landing/Features.tsx
'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import {
  Eye, Crosshair, Target, Bullet, Package,
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
  { name: 'Bullet Track', description: 'Smart bullet trajectory prediction and correction', icon: <Bullet className="size-5" />, size: 'small' },
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

    // 3D tilt on hover
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
    gsap.from(sectionRef.current!.querySelector('.section-title')!, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sectionRef.current!,
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
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm tsc --noEmit --pretty false 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/Features.tsx && git commit -m "feat: add Features bento grid with 3D tilt and staggered scroll reveal"
```

---

### Task 8: Create the Server Status API Route

**Files:**
- Create: `app/api/server-status/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// app/api/server-status/route.ts
import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/services/server-config-service';
import { listGameSettings } from '@/lib/services/game-settings-service';
import Key from '@/lib/db/models/Key';
import dbConnect from '@/lib/db/connection';

export async function GET() {
  try {
    const config = await getServerConfig();

    await dbConnect();
    const [activeKeys, games] = await Promise.all([
      Key.countDocuments({ status: 1 }),
      listGameSettings(),
    ]);

    const enabledGames = games.filter(g => g.isEnabled);

    return NextResponse.json({
      success: true,
      data: {
        status: config.maintenanceStatus === 'off' ? 'active' : 'maintenance',
        maintenance: config.maintenanceStatus,
        maintenanceMessage: config.maintenanceMessage || '',
        activePlayers: activeKeys,
        totalSlots: 500,
        version: enabledGames[0]?.modName || '3.0.0',
        modName: config.modName || '',
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        maintenance: 'off',
        maintenanceMessage: '',
        activePlayers: 0,
        totalSlots: 500,
        version: '3.0.0',
        modName: '',
      },
    });
  }
}
```

- [ ] **Step 2: Update proxy.ts to make the route public**

In `proxy.ts`, add `/api/server-status` to the `API_PUBLIC` array:

```typescript
const API_PUBLIC = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/telegram/callback', '/api/connect', '/api/free-key', '/api/download', '/api/libs/serve', '/api/server-status'];
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm tsc --noEmit --pretty false 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add app/api/server-status/route.ts proxy.ts && git commit -m "feat: add public server-status API route and update proxy whitelist"
```

---

### Task 9: Create ServerStatus Component

**Files:**
- Create: `components/landing/ServerStatus.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/ServerStatus.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Activity, Users, Wrench, Tag } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

interface StatusData {
  status: string;
  maintenance: string;
  maintenanceMessage: string;
  activePlayers: number;
  totalSlots: number;
  version: string;
  modName: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  index: number;
}

function StatCard({ icon, label, value, accentColor, index }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(cardRef.current!, {
      y: 40,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: cardRef.current!,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      delay: index * 0.1,
    });
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className="glass-card rounded-xl p-5 flex items-center gap-4">
      <div
        className="size-10 rounded-lg flex items-center justify-center"
        style={{ background: `${accentColor}20` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function ServerStatus() {
  const sectionRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<StatusData>({
    status: 'active',
    maintenance: 'off',
    maintenanceMessage: '',
    activePlayers: 0,
    totalSlots: 500,
    version: '—',
    modName: '',
  });

  useEffect(() => {
    fetch('/api/server-status')
      .then(res => res.json())
      .then(json => json.data && setData(json.data))
      .catch(() => {});
  }, []);

  const counterRef = useRef({ val: 0 });

  useGSAP(() => {
    if (data.activePlayers === 0) return;

    counterRef.current.val = 0;
    gsap.to(counterRef.current, {
      val: data.activePlayers,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sectionRef.current!,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        const el = sectionRef.current?.querySelector('.counter-value');
        if (el) el.textContent = String(Math.round(counterRef.current.val));
      },
    });
  }, { scope: sectionRef, dependencies: [data.activePlayers] });

  const isActive = data.status === 'active';

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
          Server Status
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          {data.maintenanceMessage || (isActive ? 'All systems operational' : 'Maintenance in progress')}
        </p>

        <div className="flex items-center justify-center gap-3 mb-12">
          <div
            className={`size-3 rounded-full ${isActive ? 'bg-emerald-400 status-dot-active' : 'bg-amber-400'}`}
          />
          <span className={`text-sm font-medium ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isActive ? 'Online' : 'Maintenance'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="size-5 text-emerald-400" />}
            label="Status"
            value={isActive ? 'Active' : 'Maintenance'}
            accentColor="oklch(0.7 0.2 145)"
            index={0}
          />
          <StatCard
            icon={<Users className="size-5 text-blue-400" />}
            label="Active Keys"
            value={<span className="counter-value">{data.activePlayers}</span> as unknown as string}
            accentColor="oklch(0.6 0.2 250)"
            index={1}
          />
          <StatCard
            icon={<Tag className="size-5 text-purple-400" />}
            label="Version"
            value={data.version || data.modName || '—'}
            accentColor="oklch(0.6 0.2 300)"
            index={2}
          />
          <StatCard
            icon={<Wrench className="size-5 text-amber-400" />}
            label="Maintenance"
            value={data.maintenance === 'off' ? 'Off' : 'On'}
            accentColor="oklch(0.7 0.18 80)"
            index={3}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm tsc --noEmit --pretty false 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/ServerStatus.tsx && git commit -m "feat: add ServerStatus component with animated counters and live data"
```

---

### Task 10: Create DownloadSection Component

**Files:**
- Create: `components/landing/DownloadSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/DownloadSection.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

interface DownloadLink {
  _id: string;
  appName: string;
  downloadUrl: string;
}

export function DownloadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [links, setLinks] = useState<DownloadLink[]>([]);

  useEffect(() => {
    fetch('/api/download')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setLinks(data))
      .catch(() => setLinks([]));
  }, []);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current!.querySelector('.section-title')!, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current!,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      const cards = sectionRef.current!.querySelectorAll('.download-card');
      gsap.from(cards, {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current!,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, { scope: sectionRef, dependencies: [links.length] });

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
          Downloads
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Get the latest mod client and tools for your device
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map(link => (
            <div key={link._id} className="download-card glass-card rounded-xl p-6 flex flex-col items-center gap-4">
              <Smartphone className="size-8 text-muted-foreground" />
              <h3 className="font-semibold">{link.appName}</h3>
              <Button className="w-full" asChild>
                <a href={link.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No downloads available at this time
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm tsc --noEmit --pretty false 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/DownloadSection.tsx && git commit -m "feat: add DownloadSection component with scroll-triggered card reveals"
```

---

### Task 11: Create Footer Component

**Files:**
- Create: `components/landing/Footer.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/Footer.tsx
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { APP_NAME } from '@/lib/constants/app';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(footerRef.current!, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: footerRef.current!,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: footerRef });

  return (
    <footer
      ref={footerRef}
      className="relative border-t border-white/[0.08] py-12 px-4"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Login
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Register
          </Link>
          <a
            href="https://t.me/CanKillYouForever"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Telegram
          </a>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/Footer.tsx && git commit -m "feat: add Footer component with branding and navigation links"
```

---

### Task 12: Create LandingPage Orchestrator

**Files:**
- Create: `components/landing/LandingPage.tsx`

This is the main client component that assembles all sections and forces dark mode.

- [ ] **Step 1: Create the component**

```tsx
// components/landing/LandingPage.tsx
'use client';

import { useEffect } from 'react';
import { Hero } from './Hero';
import { Features } from './Features';
import { ServerStatus } from './ServerStatus';
import { DownloadSection } from './DownloadSection';
import { Footer } from './Footer';
import { GrainOverlay } from './GrainOverlay';
import { GradientOrbs } from './GradientOrbs';
import '@/components/landing/landing.css';

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <main className="relative bg-[oklch(0.08_0_0)] text-white overflow-x-hidden">
      <GrainOverlay />
      <GradientOrbs />
      <div className="relative z-10">
        <Hero />
        <Features />
        <ServerStatus />
        <DownloadSection />
        <Footer />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add components/landing/LandingPage.tsx && git commit -m "feat: add LandingPage orchestrator with dark mode enforcement"
```

---

### Task 13: Update app/page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the redirect with the landing page**

Replace the entire content of `app/page.tsx`:

```tsx
// app/page.tsx
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  return <LandingPage />;
}
```

- [ ] **Step 2: Verify the dev server starts**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm dev &
sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: HTTP 200

- [ ] **Step 3: Stop dev server and commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && kill %1 2>/dev/null; git add app/page.tsx && git commit -m "feat: replace root redirect with landing page"
```

---

### Task 14: Final Build Verification

- [ ] **Step 1: Run linter**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm lint
```

Expected: No errors

- [ ] **Step 2: Run production build**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && pnpm build
```

Expected: Build succeeds with no errors

- [ ] **Step 3: Fix any build/lint issues if they arise, then commit**

```bash
cd "/media/jericko/New Volume1/Projects/Mod Panel" && git add -A && git commit -m "fix: resolve build issues for landing page"
```