'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, ChevronRight, X } from 'lucide-react';

interface ExpiringKey { _id: string; game: string; userKey: string; expiredDate: string; registrator: string; isFreeKey: boolean; }

export default function ExpiryNotificationBanner() {
  const router = useRouter();
  const [keys, setKeys] = useState<ExpiringKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      setNow(Date.now());
      try {
        const res = await fetch('/api/keys/expiring?hours=72');
        const result = await res.json();
        if (result.success && result.data?.length > 0) {
          setKeys(result.data);
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || dismissed || keys.length === 0) return null;

  const hoursLeft = (date: string) => {
    if (now === null) return '';
    const diff = new Date(date).getTime() - now;
    const h = Math.ceil(diff / (1000 * 60 * 60));
    if (h <= 0) return 'Expired';
    if (h < 24) return `${h}h left`;
    return `${Math.ceil(h / 24)}d left`;
  };

  return (
    <div
      className="relative overflow-hidden fade-up"
      style={{
        background: 'linear-gradient(135deg, rgba(240, 192, 64, 0.08), rgba(239, 68, 68, 0.06))',
        border: '1px solid rgba(240, 192, 64, 0.3)',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--gold), var(--red), transparent)',
        }}
      />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--gold)',
                borderRadius: '50%',
                filter: 'blur(6px)',
                opacity: 0.4,
                animation: 'statusPulse 2s infinite',
              }}
            />
            <AlertTriangle
              className="relative h-5 w-5"
              style={{ color: 'var(--gold)' }}
            />
          </div>
          <div className="min-w-0">
            <p
              className="font-semibold text-sm"
              style={{ color: 'var(--gold)', fontFamily: 'var(--ff-display)', letterSpacing: '0.04em' }}
            >
              {keys.length} key{keys.length > 1 ? 's' : ''} expiring soon
            </p>
            <div className="mt-2 space-y-1">
              {keys.slice(0, 3).map((key) => (
                <div
                  key={key._id}
                  className="flex items-center gap-2 text-xs flex-wrap"
                  style={{ color: 'var(--text-mid)' }}
                >
                  <Clock className="h-3 w-3" style={{ color: 'var(--gold)', opacity: 0.7 }} />
                  <span
                    className="uppercase font-mono"
                    style={{ color: 'var(--gold)', opacity: 0.8, fontSize: '0.7rem' }}
                  >
                    {key.game}
                  </span>
                  <span style={{ color: 'var(--text-lo)' }}>•</span>
                  <span className="font-mono" style={{ color: 'var(--text-hi)' }}>{key.userKey.slice(0, 6)}…</span>
                  <span style={{ color: 'var(--text-lo)' }}>•</span>
                  <span
                    className="font-mono"
                    style={{
                      color: hoursLeft(key.expiredDate).includes('h')
                        ? 'var(--red)'
                        : 'var(--gold)',
                    }}
                  >
                    {hoursLeft(key.expiredDate)}
                  </span>
                </div>
              ))}
              {keys.length > 3 && (
                <p className="text-xs" style={{ color: 'var(--text-lo)' }}>+{keys.length - 3} more</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/keys')}
            className="btn-outline"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.62rem',
              borderColor: 'rgba(240, 192, 64, 0.3)',
              color: 'var(--gold)',
            }}
          >
            View Keys <ChevronRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="btn-outline"
            style={{
              padding: '0.4rem',
              borderColor: 'var(--border)',
              color: 'var(--text-lo)',
            }}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
