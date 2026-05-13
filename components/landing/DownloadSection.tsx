'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, FileText, Zap } from 'lucide-react';
import '@/components/landing/landing.css';

gsap.registerPlugin(ScrollTrigger);

interface DownloadLink {
  _id: string;
  appName: string;
  downloadUrl: string;
  version?: string;
  fileSize?: string;
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
      </div>
    </section>
  );
}