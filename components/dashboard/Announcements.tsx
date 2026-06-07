'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';

interface Announcement { _id: string; title: string; content: string; priority: number; createdAt: string; }

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(setAnnouncements)
      .catch(() => {});
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2.5" style={{ marginBottom: '1.25rem' }}>
      {announcements.map((a, i) => (
        <div
          key={a._id}
          className={`panel panel-corner fade-up d${i + 1}`}
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.07), rgba(20, 184, 184, 0.04))',
            borderColor: 'rgba(167, 139, 250, 0.25)',
          }}
        >
          <div
            style={{
              padding: '0.9rem 1.25rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
            }}
          >
            <div className="relative shrink-0 mt-0.5">
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, var(--purple), var(--teal-2))',
                  borderRadius: '50%',
                  filter: 'blur(6px)',
                  opacity: 0.5,
                  animation: 'statusPulse 3s infinite',
                }}
              />
              <Megaphone className="relative h-5 w-5" style={{ color: 'var(--purple)' }} />
            </div>
            <div className="space-y-1 text-sm flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="font-semibold"
                  style={{
                    color: 'var(--text-hi)',
                    fontFamily: 'var(--ff-display)',
                    letterSpacing: '0.04em',
                    fontSize: '0.92rem',
                  }}
                >
                  {a.title}
                </p>
                {a.priority > 0 && (
                  <Sparkles className="h-3 w-3" style={{ color: 'var(--gold)' }} />
                )}
                <span
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--text-lo)',
                    letterSpacing: '0.08em',
                    marginLeft: 'auto',
                  }}
                >
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p
                className="whitespace-pre-wrap"
                style={{ color: 'var(--text-mid)', lineHeight: 1.55, fontSize: '0.85rem' }}
              >
                {a.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
