'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Activity, Users, Wrench, Tag, Signal, Sparkles } from 'lucide-react';
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

function StatCard({ icon, label, value, accentColor, index }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accentColor: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    gsap.fromTo(card,
      { y: 40, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        delay: index * 0.1,
      }
    );
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-white/[0.15] transition-all">
      <div
        className="size-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}15` }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/50 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-lg font-semibold truncate">{value}</p>
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
    const section = sectionRef.current;
    if (!section || data.activePlayers === 0) return;

    counterRef.current.val = 0;
    gsap.to(counterRef.current, {
      val: data.activePlayers,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Signal className="size-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-white/70">Live Status</span>
          </div>
          <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Server Status
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            {data.maintenanceMessage || (isActive ? 'All systems operational — everything is running smoothly.' : 'Maintenance in progress')}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="relative">
            <div
              className={`size-3.5 rounded-full ${isActive ? 'bg-emerald-400 status-dot-active' : 'bg-amber-400'}`}
            />
          </div>
          <span className={`text-sm font-semibold ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isActive ? 'System Online' : 'Maintenance'}
          </span>
          {isActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="size-3 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">All Good</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="size-5" />}
            label="Status"
            value={isActive ? 'Active' : 'Maintenance'}
            accentColor="oklch(0.7 0.2 145)"
            index={0}
          />
          <StatCard
            icon={<Users className="size-5" />}
            label="Active Keys"
            value={<span className="counter-value font-bold">{data.activePlayers}</span>}
            accentColor="oklch(0.6 0.2 250)"
            index={1}
          />
          <StatCard
            icon={<Tag className="size-5" />}
            label="Version"
            value={data.version || data.modName || '—'}
            accentColor="oklch(0.6 0.2 300)"
            index={2}
          />
          <StatCard
            icon={<Wrench className="size-5" />}
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
