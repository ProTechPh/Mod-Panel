'use client';

import { useEffect } from 'react';
import { Hero } from './Hero';
import { Features } from './Features';
import { ServerStatus } from './ServerStatus';
import { DownloadSection } from './DownloadSection';
import { Footer } from './Footer';
import { GrainOverlay } from './GrainOverlay';
import { GradientOrbs } from './GradientOrbs';
import { SpotlightCursor } from './SpotlightCursor';
import { ScrollIndicator } from './ScrollIndicator';
import '@/components/landing/landing.css';

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <main className="relative bg-[oklch(0.08_0_0)] text-white min-h-screen overflow-x-clip">
      <GrainOverlay />
      <GradientOrbs />
      <SpotlightCursor />
      <div className="relative z-10">
        <Hero />
        <ScrollIndicator />
        <Features />
        <ServerStatus />
        <DownloadSection />
        <Footer />
      </div>
    </main>
  );
}