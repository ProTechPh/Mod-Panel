'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { HardDrive, Server } from 'lucide-react';

interface FtpStatsData {
  disk: { used: number; total: number; used_human: string; total_human: string; percent: number };
  inodes: { used: number; total: number; percent: number };
}

export default function FtpStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FtpStatsData | null>(null);

  useEffect(() => {
    if (!user || user.level > 2) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch('/api/ftp/stats');
        const data = await r.json();
        if (!cancelled) setStats(data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user || user.level > 2) return null;
  if (!stats) return null;

  const { disk, inodes } = stats;

  return (
    <div className="panel panel-corner fade-up d4">
      <div className="panel-head">
        <div className="panel-title">
          <HardDrive size={16} className="ico" />
          FTP Storage
        </div>
        <span className="panel-badge">Live</span>
      </div>
      <div style={{ padding: '1.25rem' }} className="space-y-4">
        <div
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(20, 184, 184, 0.05)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span
              className="flex items-center gap-1.5"
              style={{ color: 'var(--text-mid)' }}
            >
              <Server className="h-3.5 w-3.5" style={{ color: 'var(--teal-2)' }} />
              Disk Space Usage
            </span>
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--text-hi)' }}
            >
              {disk.used_human} / {disk.total_human}
            </span>
          </div>
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(20, 184, 184, 0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(disk.percent, 100)}%`,
                background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2))',
                boxShadow: '0 0 8px rgba(20, 184, 184, 0.4)',
              }}
            />
          </div>
          <p
            className="text-xs mt-1.5 font-mono"
            style={{ color: 'var(--text-lo)' }}
          >
            {disk.percent}% Used
          </p>
        </div>

        <div
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(240, 192, 64, 0.05)',
            border: '1px solid rgba(240, 192, 64, 0.18)',
          }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span
              className="flex items-center gap-1.5"
              style={{ color: 'var(--text-mid)' }}
            >
              <HardDrive className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
              Inode Usage
            </span>
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--text-hi)' }}
            >
              {(inodes.used ?? 0).toLocaleString()} / {inodes.total.toLocaleString()}
            </span>
          </div>
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(240, 192, 64, 0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(inodes.percent, 100)}%`,
                background: 'linear-gradient(90deg, var(--gold), #d4a02a)',
                boxShadow: '0 0 8px rgba(240, 192, 64, 0.4)',
              }}
            />
          </div>
          <p
            className="text-xs mt-1.5 font-mono"
            style={{ color: 'var(--text-lo)' }}
          >
            {inodes.percent}% Used
          </p>
        </div>
      </div>
    </div>
  );
}
