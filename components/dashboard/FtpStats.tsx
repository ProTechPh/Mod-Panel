'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/shared/AuthProvider';
import { HardDrive, Server } from 'lucide-react';

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
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-cyan-400" />
            FTP Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-purple-400" />
                Disk Space Usage
              </span>
              <span className="font-mono text-xs">{disk.used_human} / {disk.total_human}</span>
            </div>
            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-1000"
                style={{ width: `${Math.min(disk.percent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">{disk.percent}% Used</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                Inode Usage
              </span>
              <span className="font-mono text-xs">{(inodes.used ?? 0).toLocaleString()} / {inodes.total.toLocaleString()}</span>
            </div>
            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${Math.min(inodes.percent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">{inodes.percent}% Used</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
