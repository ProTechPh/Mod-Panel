'use client';

import { useEffect, useState } from 'react';
import './landing.css';
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

  const totalKeys = '120K+';
  const uptime = '99.97%';

  return (
    <>
      <TopNav />

      <main className="landing-main">
        {/* Animated ambient space mesh background */}
        <div className="ambient-mesh">
          <div className="ambient-orb-1" />
          <div className="ambient-orb-2" />
        </div>

        <Hero
          totalKeys={totalKeys}
          uptime={uptime}
          countries=""
        />

        <StatsBar
          version={status.version}
          activeKeys={status.activePlayers}
          totalSlots={status.totalSlots}
          maintenanceOn={status.maintenance === 'on'}
        />

        <div className="landing-content">
          <div className="landing-primary">
            <Features />
            <HowItWorks />
            <DownloadSection />
          </div>

          <div className="landing-sidebar">
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
