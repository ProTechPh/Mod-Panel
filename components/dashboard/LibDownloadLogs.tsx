'use client';

import { useEffect, useState } from 'react';
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
  const [logs, setLogs] = useState<LogEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/libs/logs');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const next = Array.isArray(data) ? data : [];
        setLogs((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return next;
        });
      } catch {}
    };
    void poll();
    const interval = setInterval(() => { void poll(); }, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const list = logs ?? [];

  return (
    <div className="panel panel-corner fade-up d5">
      <div className="panel-head">
        <div className="panel-title">
          <History size={16} className="ico" />
          Lib Download Logs
        </div>
        <span
          className="panel-badge"
          style={{
            background: 'rgba(57, 255, 20, 0.08)',
            borderColor: 'rgba(57, 255, 20, 0.25)',
            color: '#86efac',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--ecto-green)',
              marginRight: '0.35rem',
              boxShadow: '0 0 5px var(--ecto-green)',
              animation: 'statusPulse 2s infinite',
            }}
          />
          Live
        </span>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-ring">
            <History size={26} />
          </div>
          <div className="empty-title">No Logs Yet</div>
          <div className="empty-sub">Download activity will appear here in real-time.</div>
        </div>
      ) : (
        <div
          className="space-y-2"
          style={{
            padding: '0.85rem',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {list.map(log => (
            <div
              key={log._id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors"
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(20, 184, 184, 0.04)',
              }}
            >
              <div
                className="shrink-0 mt-0.5 size-7 rounded-md flex items-center justify-center"
                style={{
                  background: 'rgba(20, 184, 184, 0.1)',
                  color: 'var(--teal-2)',
                }}
              >
                <Monitor className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono font-medium truncate"
                    style={{ color: 'var(--text-hi)', fontSize: '0.78rem' }}
                  >
                    {log.fileName}
                  </span>
                  <span
                    className="shrink-0"
                    style={{
                      color: 'var(--text-lo)',
                      fontFamily: 'var(--ff-mono)',
                      fontSize: '0.6rem',
                    }}
                  >
                    {new Date(log.downloadedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="flex items-center gap-1"
                    style={{ color: 'var(--text-mid)' }}
                  >
                    <Globe className="h-3 w-3" style={{ color: 'var(--teal-2)' }} />
                    {log.ipAddress}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    style={{ color: 'var(--text-mid)' }}
                  >
                    <Monitor className="h-3 w-3" />
                    {log.device || 'Unknown'}
                  </span>
                  {log.userAgent && (
                    <span
                      className="truncate max-w-[200px]"
                      style={{ color: 'var(--text-lo)' }}
                      title={log.userAgent}
                    >
                      {log.userAgent}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
