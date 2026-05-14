'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGsapScroll';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Smartphone, Play, Heart, Search, Clock, Radio, ExternalLink,
  Sparkles, Users, ChevronRight
} from 'lucide-react';
import '@/components/landing/landing.css';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface PublicStreamer {
  _id: string;
  tiktokUsername: string;
  streamerName: string;
  status: string;
  isLive: boolean;
  liveDuration: number;
  lastLive: string | null;
  lastLiveDuration: number;
  autoExtendEnabled: boolean;
  keyExpiry: string | null;
}

export function TikTokLiveSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [streamers, setStreamers] = useState<PublicStreamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLive, setFilterLive] = useState(false);

  useEffect(() => {
    fetch('/api/streamers/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setStreamers(data.data);
        }
      })
      .catch(() => setStreamers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredStreamers = useMemo(() => {
    let result = streamers;
    if (filterLive) {
      result = result.filter(s => s.isLive);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.streamerName.toLowerCase().includes(q) ||
        s.tiktokUsername.toLowerCase().includes(q)
      );
    }
    return result;
  }, [streamers, searchQuery, filterLive]);

  const liveCount = streamers.filter(s => s.isLive).length;

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      if (!section) return;

      const title = section.querySelector('.section-title');
      if (title) {
        gsap.fromTo(title,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      const cards = section.querySelectorAll('.tiktok-browse-card');
      if (cards.length === 0) return;

      gsap.fromTo(cards,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, { scope: sectionRef, dependencies: [filteredStreamers.length] });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatLastLive = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <section ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
            <Radio className="size-3.5 text-pink-400" />
            <span className="text-xs font-medium text-pink-400 tracking-wide uppercase">Browse Streamers</span>
          </div>
          <h2 className="section-title text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              TikTok Live Streamers
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our community of streamers. Watch them live and see their stats.
          </p>
        </div>

        {/* Live indicator bar */}
        {!loading && (
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {liveCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-400">
                    {liveCount} live now
                  </span>
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {streamers.length} streamer{streamers.length !== 1 ? 's' : ''} total
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search streamers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-48 h-9 pl-9 text-sm bg-white/5 border-white/10 focus:border-purple-500/50"
                />
              </div>
              <Button
                variant={filterLive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterLive(!filterLive)}
                className={cn(
                  'h-9 text-xs gap-1.5',
                  filterLive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <div className={cn('h-1.5 w-1.5 rounded-full', filterLive ? 'bg-red-500' : 'bg-muted-foreground')} />
                Live Only
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500/20 border-t-purple-500" />
              <Radio className="absolute inset-0 m-auto size-5 text-purple-400 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading streamers...</p>
          </div>
        ) : filteredStreamers.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center p-5 rounded-full bg-muted/30 mb-5">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">
              {searchQuery ? 'No streamers match your search' : 'No streamers yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery ? 'Try a different search term' : 'Be the first to join our TikTok live program!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStreamers.map((streamer) => (
              <div
                key={streamer._id}
                className={cn(
                  'tiktok-browse-card group relative rounded-2xl overflow-hidden transition-all duration-300',
                  'border hover:shadow-2xl',
                  streamer.isLive
                    ? 'border-red-500/30 bg-red-500/[0.03] hover:border-red-500/50 hover:shadow-red-500/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-purple-500/30 hover:shadow-purple-500/10'
                )}
              >
                {/* Live glow effect */}
                {streamer.isLive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
                )}

                <div className="p-4 flex flex-col gap-3 h-full">
                  {/* Top row: Avatar + Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={cn(
                        'relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold',
                        streamer.isLive
                          ? 'bg-gradient-to-br from-red-500/20 to-pink-500/20 ring-2 ring-red-500/40'
                          : 'bg-gradient-to-br from-purple-500/15 to-pink-500/15'
                      )}>
                        <span className={cn(
                          streamer.isLive ? 'text-red-400' : 'text-purple-400'
                        )}>
                          {streamer.streamerName.charAt(0).toUpperCase()}
                        </span>
                        {streamer.isLive && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-[oklch(0.08_0_0)] animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-white transition-colors">
                          {streamer.streamerName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          @{streamer.tiktokUsername}
                        </p>
                      </div>
                    </div>

                    {streamer.isLive && (
                      <Badge className="shrink-0 bg-red-500/15 text-red-400 border-red-500/20 text-[10px] px-2 py-0.5 gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-purple-400" />
                      <span>{formatTime(streamer.liveDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="size-3 text-pink-400" />
                      <span>{formatLastLive(streamer.lastLive)}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <a
                    href={`https://www.tiktok.com/@${streamer.tiktokUsername}/live`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'mt-auto flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      streamer.isLive
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/[0.06] hover:border-purple-500/20'
                    )}
                  >
                    {streamer.isLive ? (
                      <>
                        <Play className="size-3.5 fill-current" />
                        Watch Live
                        <ExternalLink className="size-3 opacity-60" />
                      </>
                    ) : (
                      <>
                        <Users className="size-3.5" />
                        View Profile
                        <ChevronRight className="size-3.5 opacity-60" />
                      </>
                    )}
                  </a>
                </div>
              </div>
            ))}

            {/* Join as Streamer CTA Card */}
            <div className="tiktok-browse-card group relative rounded-2xl overflow-hidden border-2 border-dashed border-purple-500/20 hover:border-purple-500/40 bg-purple-500/[0.02] transition-all duration-300">
              <div className="p-4 flex flex-col items-center justify-center gap-3 h-full text-center min-h-[180px]">
                <div className="p-3 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="size-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Become a Streamer</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                    Get your license key and join our community
                  </p>
                </div>
                <Button
                  size="sm"
                  nativeButton={false}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs"
                  render={<Link href="/tiktok-live/register" />}
                >
                  Register Now
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
