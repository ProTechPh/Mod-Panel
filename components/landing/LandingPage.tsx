'use client';

import { Hero } from './Hero';
import { Features } from './Features';
import { ServerStatus } from './ServerStatus';
import { StatsBar } from './StatsBar';
import { HowItWorks } from './HowItWorks';
import { DownloadSection } from './DownloadSection';
import { Footer } from './Footer';
import { GrainOverlay } from './GrainOverlay';
import { GradientOrbs } from './GradientOrbs';
import { SpotlightCursor } from './SpotlightCursor';
import { ParticleField } from './ParticleField';
import { TikTokLiveSection } from './TikTokLiveSection';
import { ThemeToggle } from './ThemeToggle';
import '@/components/landing/landing.css';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip" style={{ background: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
      <ThemeToggle />
      <GrainOverlay />
      <ParticleField />
      <GradientOrbs />
      <SpotlightCursor />
      <div className="relative z-10">
        <Hero />
        <StatsBar />
        <Features />
        <HowItWorks />
        <ServerStatus />
        <DownloadSection />
        <TikTokLiveSection />
        <Footer />
      </div>
    </main>
  );
}
