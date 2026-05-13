'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Button } from '@/components/ui/button';
import { Smartphone, Play, Heart, Users } from 'lucide-react';
import '@/components/landing/landing.css';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface TikTokLiveLink {
  _id: string;
  tiktokUsername: string;
  streamerName: string;
  contact: string;
  status: string;
  liveDuration: number;
  lastLive: string;
}

export function TikTokLiveSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [streamers, setStreamers] = useState<TikTokLiveLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tiktok-live-streamers')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setStreamers(data.slice(0, 6)))
      .catch(() => setStreamers([]))
      .finally(() => setLoading(false));
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

      const cards = section.querySelectorAll('.tiktok-live-card');
      if (cards.length === 0) return;

      gsap.from(cards, {
        y: 40,
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
  }, { scope: sectionRef, dependencies: [streamers.length] });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              TikTok Live Streamers
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our community of TikTok live streamers and get exclusive mod features
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {streamers.map((streamer) => (
              <div key={streamer._id} className="tiktok-live-card glass-card rounded-2xl p-6 flex flex-col gap-4 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="feature-icon-bg" style={{ backgroundColor: 'oklch(0.5 0.4 300 / 15%)' }}>
                      <Smartphone className="size-6" style={{ color: 'oklch(0.5 0.4 300)' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{streamer.streamerName}</h3>
                      <p className="text-sm text-purple-400">@{streamer.tiktokUsername}</p>
                    </div>
                  </div>
                  {streamer.status === 'active' && (
                    <span className="flex items-center gap-1 bg-red-500/15 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/20">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Heart className="size-3 text-pink-500" />
                    <span>{formatTime(streamer.liveDuration)} total live time</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3 text-purple-500" />
                    <span>{streamer.contact}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-auto bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40 text-purple-300" 
                  onClick={() => {
                    window.location.href = `https://www.tiktok.com/@${streamer.tiktokUsername}/live`;
                  }}
                >
                  <Play className="size-4 mr-2" />
                  Watch Live
                </Button>
              </div>
            ))}

            {streamers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="inline-block p-4 rounded-full bg-muted/50 mb-4">
                  <Play className="size-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">No live streamers currently</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to join our TikTok live program!
                </p>
              </div>
            )}

            <div className="col-span-full flex justify-center">
              <div className="tiktok-live-card glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 border border-dashed border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 w-full sm:w-auto sm:max-w-sm">
                <div className="feature-icon-bg" style={{ backgroundColor: 'oklch(0.5 0.4 300 / 15%)' }}>
                  <Smartphone className="size-8" style={{ color: 'oklch(0.5 0.4 300)' }} />
                </div>
                <h3 className="font-bold text-xl">Join as Streamer</h3>
                <p className="text-sm text-center text-muted-foreground max-w-xs">
                  Register and get your own TikTok live streamer key
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8"
                  onClick={() => {
                    window.location.href = '/tiktok-live/register';
                  }}
                >
                  Register Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
