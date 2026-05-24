'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FtpStatsData {
  disk: { used: number; total: number; used_human: string; total_human: string; percent: number };
  inodes: { used: number; total: number; percent: number };
  bandwidth?: { used_human: string; total_human: string };
  hits?: { used_human: string; total_human: string };
  _note?: string;
}

export default function FtpStats() {
  const [stats, setStats] = useState<FtpStatsData | null>(null);

  useEffect(() => {
    fetch('/api/ftp/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const { disk, inodes, bandwidth, hits } = stats;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">FTP Storage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disk */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Disk Space Usage</span>
            <span>{disk.used_human} / {disk.total_human}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(disk.percent, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{disk.percent}% Used</p>
        </div>

        {/* Bandwidth */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Bandwidth Usage</span>
            <span>{bandwidth?.used_human ?? 'N/A'} / {bandwidth?.total_human ?? 'Unlimited'}</span>
          </div>
        </div>

        {/* Inodes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Inode Usage</span>
            <span>{(inodes.used ?? 0).toLocaleString()} / {inodes.total.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${Math.min(inodes.percent, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{inodes.percent}% Used</p>
        </div>

        {/* Hits */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Hits Usage Today</span>
            <span>{hits?.used_human ?? 'N/A'} / {hits?.total_human ?? '50,000'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
