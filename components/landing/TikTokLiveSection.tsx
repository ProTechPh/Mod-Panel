'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Radio, Play, Heart, Search, Clock, Users, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import '@/components/landing/landing.css';

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

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatLastLive(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function TikTokLiveSection() {
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
    if (filterLive) result = result.filter(s => s.isLive);
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

  return (
    <div className="panel fade-up d4 panel-corner" id="streamers">
      <div className="panel-head">
        <div className="panel-title">
          <Radio className="ico" size={16} />
          TikTok Live Streamers
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {liveCount > 0 && (
            <span
              className="panel-badge"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--red)',
                  marginRight: '0.35rem',
                  boxShadow: '0 0 5px var(--red)',
                }}
              />
              {liveCount} LIVE
            </span>
          )}
          <span className="panel-badge">{streamers.length} total</span>
        </div>
      </div>

      {!loading && (
        <div className="filter-bar">
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-lo)',
              }}
            />
            <input
              className="filter-input"
              placeholder="Search streamers…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button
            className={`filter-chip ${filterLive ? 'active' : ''}`}
            onClick={() => setFilterLive(!filterLive)}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: filterLive ? 'var(--red)' : 'var(--text-lo)',
                boxShadow: filterLive ? '0 0 6px var(--red)' : 'none',
              }}
            />
            Live Only
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2.5rem 1.4rem', textAlign: 'center' }}>
          <div
            className="inline-block size-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(20, 184, 184, 0.2)', borderTopColor: 'var(--teal-2)' }}
          />
          <p className="mt-3 text-sm font-mono" style={{ color: 'var(--text-lo)' }}>Scanning network…</p>
        </div>
      ) : filteredStreamers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-ring">
            <Search size={26} />
          </div>
          <div className="empty-title">
            {searchQuery ? 'No Matches Found' : 'No Streamers Yet'}
          </div>
          <div className="empty-sub">
            {searchQuery
              ? 'Try a different search term.'
              : 'Be the first to join our TikTok live program!'}
          </div>
        </div>
      ) : (
        <div className="streamer-grid">
          {filteredStreamers.map((streamer) => (
            <div
              key={streamer._id}
              className={`streamer-card ${streamer.isLive ? 'live' : ''}`}
            >
              <div className="streamer-head">
                <div className="streamer-avatar">
                  {streamer.streamerName.charAt(0).toUpperCase()}
                  {streamer.isLive && <span className="live-dot" />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="streamer-name">{streamer.streamerName}</div>
                  <div className="streamer-handle">@{streamer.tiktokUsername}</div>
                </div>
                {streamer.isLive && <span className="live-badge">LIVE</span>}
              </div>

              <div className="streamer-meta">
                <span className="streamer-meta-item">
                  <Clock size={11} /> {formatTime(streamer.liveDuration)}
                </span>
                <span className="streamer-meta-item">
                  <Heart size={11} /> {formatLastLive(streamer.lastLive)}
                </span>
              </div>

              <a
                href={`https://www.tiktok.com/@${streamer.tiktokUsername}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className={`streamer-cta ${streamer.isLive ? 'live' : 'idle'}`}
              >
                {streamer.isLive ? (
                  <>
                    <Play size={11} fill="currentColor" />
                    Watch Live
                    <ExternalLink size={10} style={{ opacity: 0.6 }} />
                  </>
                ) : (
                  <>
                    <Users size={11} />
                    View Profile
                    <ChevronRight size={11} style={{ opacity: 0.6 }} />
                  </>
                )}
              </a>
            </div>
          ))}

          {/* Become a Streamer CTA */}
          <div
            className="streamer-card"
            style={{
              border: '2px dashed var(--border)',
              background: 'rgba(167, 139, 250, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '140px',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(167, 139, 250, 0.1)',
                color: 'var(--purple)',
                marginBottom: '0.6rem',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div className="streamer-name" style={{ textAlign: 'center' }}>Become a Streamer</div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-lo)',
                lineHeight: 1.4,
                maxWidth: 180,
                margin: '0.25rem 0 0.75rem',
              }}
            >
              Get your license key and join the program.
            </div>
            <Link
              href="/tiktok-live/register"
              className="streamer-cta idle"
              style={{ width: '100%' }}
            >
              Register Now
              <ChevronRight size={11} style={{ opacity: 0.6 }} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
