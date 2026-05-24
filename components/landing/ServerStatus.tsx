'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Activity, Users, Wrench, Tag, Signal, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
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
  icon: React.ReactNode; label: string; value: React.ReactNode; accentColor: string; index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.fromTo(card,
      { y: 50, opacity: 0, scale: 0.9 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)',
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        delay: index * 0.1,
      }
    );
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className="glow-card rounded-xl p-5 flex items-center gap-4 group relative overflow-hidden">
      <div
        className="size-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
        style={{ background: `${accentColor}15` }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--landing-text-subtle)' }}>{label}</p>
        <p className="text-xl font-black truncate">{value}</p>
      </div>
    </div>
  );
}

export function ServerStatus() {
  const sectionRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<StatusData>({
    status: 'active', maintenance: 'off', maintenanceMessage: '',
    activePlayers: 0, totalSlots: 500, version: '—', modName: '',
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
      val: data.activePlayers, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
      onUpdate: () => {
        const el = sectionRef.current?.querySelector('.counter-value');
        if (el) el.textContent = String(Math.round(counterRef.current.val));
      },
    });
  }, { scope: sectionRef, dependencies: [data.activePlayers] });

  const isActive = data.status === 'active';

  return (
    <section ref={sectionRef} className="relative py-28 px-4">
      <div className="section-divider max-w-5xl mx-auto mb-20" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glow-card mb-6 group">
            <Signal className="size-4 text-emerald-500 transition-transform group-hover:rotate-12" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--landing-text-muted)' }}>
              <span className="text-emerald-500">●</span> Live Monitoring
            </span>
          </div>
          <h2 className="section-title text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Server{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400">Status</span>
          </h2>
          <p style={{ color: 'var(--landing-text-muted)' }} className="max-w-lg mx-auto">
            {data.maintenanceMessage || (isActive ? 'All systems operational — every service is running at peak performance.' : 'Maintenance in progress')}
          </p>
        </div>

        {/* Mega status indicator */}
        <div className="flex flex-col items-center justify-center gap-4 mb-12">
          <div className="relative">
            <div className={`size-16 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <div className={`size-10 rounded-full ${isActive ? 'bg-emerald-500 status-dot-active' : 'bg-amber-500 animate-pulse'}`} />
            </div>
            {/* Ripple rings */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-black ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isActive ? 'All Systems Online' : 'Maintenance'}
            </span>
            {isActive && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'oklch(0.7 0.2 145 / 10%)', color: '#4ade80', border: '1px solid oklch(0.7 0.2 145 / 20%)' }}>
                <CheckCircle className="size-3" /> Verified
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--landing-text-subtle)' }}>
            <span className="flex items-center gap-1"><Activity className="size-3" /> Response: &lt;20ms</span>
            <span className="flex items-center gap-1"><Users className="size-3" /> Slots: {data.activePlayers}/{data.totalSlots}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Activity className="size-5" />} label="Status" value={isActive ? 'Active' : 'Maintenance'} accentColor="#4ade80" index={0} />
          <StatCard icon={<Users className="size-5" />} label="Active Keys" value={<span className="counter-value font-black">{data.activePlayers}</span>} accentColor="#60a5fa" index={1} />
          <StatCard icon={<Tag className="size-5" />} label="Version" value={data.version || data.modName || '—'} accentColor="#c084fc" index={2} />
          <StatCard icon={<Wrench className="size-5" />} label="Maintenance" value={data.maintenance === 'off' ? 'Off' : 'On'} accentColor="#fbbf24" index={3} />
        </div>
      </div>
    </section>
  );
}
