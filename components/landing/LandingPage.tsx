'use client';

import { useEffect, useState } from 'react';
import { Hero } from './Hero';
import { Features } from './Features';
import { ServerStatus } from './ServerStatus';
import { StatsBar } from './StatsBar';
import { HowItWorks } from './HowItWorks';
import { DownloadSection } from './DownloadSection';
import { Footer } from './Footer';
import { TopNav } from './TopNav';
import { QuickActions } from './QuickActions';
import { ActivityFeed } from './ActivityFeed';
import { GrainOverlay } from './GrainOverlay';
import { GradientOrbs } from './GradientOrbs';
import { SparkleCanvas } from './SparkleCanvas';
import '@/components/landing/landing.css';

interface StatusData {
  status: string;
  maintenance: string;
  activePlayers: number;
  totalSlots: number;
  version: string;
  modName: string;
}

const FALLBACK_STATUS: StatusData = {
  status: 'active',
  maintenance: 'off',
  activePlayers: 0,
  totalSlots: 500,
  version: 'v3.2',
  modName: '',
};

export default function LandingPage() {
  const [status, setStatus] = useState<StatusData>(FALLBACK_STATUS);

  useEffect(() => {
    fetch('/api/server-status')
      .then(res => res.json())
      .then(json => json.data && setStatus(prev => ({ ...prev, ...json.data })))
      .catch(() => {});
  }, []);

  const activeUsers = status.activePlayers > 0
    ? status.activePlayers.toLocaleString()
    : '15K+';
  const totalKeys = '120K+';
  const uptime = '99.97%';
  const countries = '50+';

  return (
    <>
      <TopNav />

      <GradientOrbs />
      <SparkleCanvas />
      <GrainOverlay />

      <main className="gs-main">
        <Hero
          activeUsers={activeUsers}
          totalKeys={totalKeys}
          uptime={uptime}
          countries={countries}
        />

        <StatsBar
          version={status.version}
          activeKeys={status.activePlayers}
          totalSlots={status.totalSlots}
          maintenanceOn={status.maintenance === 'on'}
        />

        <div className="content-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Features />
            <HowItWorks />
            <DownloadSection />
          </div>

          <div className="right-col">
            <QuickActions />
            <ServerStatus />
            <ActivityFeed version={status.version} />
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
