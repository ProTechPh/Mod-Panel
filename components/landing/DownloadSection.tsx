'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, FileText, Zap, Shield } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

interface DownloadLink {
  _id: string;
  appName: string;
  downloadUrl: string;
  version?: string;
  fileSize?: string;
}

const VIRTUAL_APPS = [
  { name: 'ChoRok Virtual V2', url: 'https://www.mediafire.com/file/ruh6p6m36o9hv47/ChoRok_Virtual_V2.apk/file', recommended: true },
  { name: 'ChoRok Virtual', url: 'https://www.mediafire.com/file/v0j99yby45pluo8/ChoRok_Virtual.apk/file' },
  { name: 'GODZ Virtual', url: 'https://www.mediafire.com/file/73jpkuwb9tpjye6/GODZ_VIRTUAL.apk/file' },
  { name: 'GSPACE Virtual', url: 'https://www.mediafire.com/file/4v1miuim8209lio/GSPACE_VIRTUAL.apk/file' },
  { name: 'MIKASA Virtual V2', url: 'https://www.mediafire.com/file/ljfn9bjhmlmbobk/MIKASA_VIRTUAL_V2.apk/file' },
  { name: 'OpsTG Virtual V2', url: 'https://www.mediafire.com/file/l07bj31supspspz/OpsTG_VIRTUAL__%255BV2%255D_OpsTG_%255BV2%255D.apk/file' },
  { name: 'Virtual Mod', url: 'https://www.mediafire.com/file/syxeaxm7om7izs3/VIRTUAL_MOD.apk/file' },
  { name: 'Alexa Virtual (64Bit) - Fixed', url: 'https://www.mediafire.com/file/r9jftm7r8vjujf5/%255BFIXED%255D_Alexa_Virtual_-_64Bit.apk/file' },
];

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
      const section = sectionRef.current;
      if (!section) return;

      const title = section.querySelector('.section-title');
      if (title) {
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
      }

      const cards = section.querySelectorAll('.download-card');
      if (cards.length === 0) return;

      gsap.from(cards, {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
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
            <div key={link._id} className="download-card glass-card rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="feature-icon-bg" style={{ backgroundColor: 'oklch(0.5 0.2 270 / 15%)' }}>
                  <Smartphone className="size-5" style={{ color: 'oklch(0.5 0.2 270)' }} />
                </div>
                {link.version && (
                  <span className="download-badge text-emerald-400">
                    <Zap className="size-3" /> v{link.version}
                  </span>
                )}
              </div>
              <h3 className="font-semibold">{link.appName}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="size-3" /> {link.fileSize || 'N/A'}
                </span>
              </div>
              <Button className="w-full mt-auto" nativeButton={false} render={<a href={link.downloadUrl} target="_blank" rel="noopener noreferrer" />}>
                <Download className="size-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No downloads available at this time
            </p>
          )}
        </div>

        {/* Virtual Apps Section */}
        <div className="mt-16">
          <h3 className="section-title text-2xl font-bold tracking-tight text-center mb-8">
            Virtual Apps
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VIRTUAL_APPS.map((app, index) => (
              <div key={index} className="download-card glass-card rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="feature-icon-bg" style={{ backgroundColor: 'oklch(0.7 0.1 150 / 15%)' }}>
                    <Shield className="size-4" style={{ color: 'oklch(0.7 0.1 150)' }} />
                  </div>
                  {app.recommended && (
                    <span className="download-badge text-amber-400 bg-amber-400/10 border-amber-400/20">
                      <Zap className="size-3" /> Recommended
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-sm">{app.name}</h4>
                <Button 
                  size="sm"
                  variant="outline"
                  className="w-full mt-2" 
                  asChild
                >
                  <a href={app.url} target="_blank" rel="noopener noreferrer">
                    <Download className="size-3 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}