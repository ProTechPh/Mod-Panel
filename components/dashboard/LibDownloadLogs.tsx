'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Globe, Monitor } from 'lucide-react';

interface LogEntry {
  _id: string;
  fileName: string;
  ipAddress: string;
  device: string;
  userAgent: string;
  downloadedAt: string;
}

export default function LibDownloadLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/libs/logs');
      if (!res.ok) return;
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-purple-400" />
            Lib Download Logs
            <span className="ml-auto text-xs font-normal text-muted-foreground animate-pulse">● Live</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No download logs yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {logs.map(log => (
                <div key={log._id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5 text-xs">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-foreground font-medium truncate">{log.fileName}</span>
                      <span className="text-muted-foreground shrink-0">{new Date(log.downloadedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {log.ipAddress}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        {log.device || 'Unknown'}
                      </span>
                      {log.userAgent && (
                        <span className="text-muted-foreground/60 truncate max-w-[200px]" title={log.userAgent}>
                          {log.userAgent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
