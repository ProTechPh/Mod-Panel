'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/shared/AuthProvider';

interface FtpStatsData {
  disk: { used: number; total: number; used_human: string; total_human: string; percent: number };
  inodes: { used: number; total: number; percent: number };
}

export default function FtpStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FtpStatsData | null>(null);

  if (!user || user.level > 2) return null;

  useEffect(() => {
    fetch('/api/ftp/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const { disk, inodes } = stats;

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

      </CardContent>
    </Card>
  );
}
