'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Search, ChevronLeft, ChevronRight, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

interface AuditLog {
  _id: string;
  action: string;
  actor: string;
  actorLevel: number;
  target: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

const ACTIONS = [
  { value: '', label: 'All' },
  { value: 'key.generate', label: 'key.generate' },
  { value: 'key.delete', label: 'key.delete' },
  { value: 'key.reset', label: 'key.reset' },
  { value: 'key.edit', label: 'key.edit' },
  { value: 'user.login', label: 'user.login' },
  { value: 'user.logout', label: 'user.logout' },
  { value: 'settings.update', label: 'settings.update' },
];

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'key.generate': { bg: 'rgba(22, 163, 74, 0.12)', text: 'var(--ecto-green)', border: 'rgba(22, 163, 74, 0.3)' },
  'key.delete': { bg: 'rgba(239, 68, 68, 0.12)', text: 'var(--red)', border: 'rgba(239, 68, 68, 0.3)' },
  'key.reset': { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  'key.edit': { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  'user.login': { bg: 'rgba(20, 184, 184, 0.12)', text: 'var(--teal-2)', border: 'rgba(20, 184, 184, 0.3)' },
  'user.logout': { bg: 'rgba(20, 184, 184, 0.12)', text: 'var(--teal-2)', border: 'rgba(20, 184, 184, 0.3)' },
  'settings.update': { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const PAGE_SIZE = 50;

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  const fetchLogs = useCallback(async (pageVal = 1) => {
    setLoading(true);
    try {
      const start = (pageVal - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        draw: '1',
        start: String(start),
        length: String(PAGE_SIZE),
      });
      if (search) params.set('search[value]', search);
      if (action) params.set('action', action);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setLogs(data.data || []);
      setTotalFiltered(data.recordsFiltered ?? 0);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, action, startDate, endDate]);

  useEffect(() => { void fetchLogs(); }, []);

  const handleSearch = () => { setPage(1); fetchLogs(1); };

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Security"
        title="AUDIT"
        highlight="LOG"
        sub="Track all actions across the panel."
      />

      <Card className="fade-up d1">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-lo)] pointer-events-none" />
                <Input
                  placeholder="// search actor, target, or action…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
              <select
                value={action}
                onChange={e => { setAction(e.target.value); setPage(1); }}
                className="flex h-9 rounded-md border px-3 py-1 text-sm font-mono bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text-hi)' }}
              >
                {ACTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="flex h-9 rounded-md border px-3 py-1 text-sm font-mono bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text-hi)' }}
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="flex h-9 rounded-md border px-3 py-1 text-sm font-mono bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text-hi)' }}
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 font-mono text-xs">
                      <span className="inline-block size-2 rounded-full bg-[var(--teal-2)] animate-pulse" />
                      Loading audit logs…
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Terminal className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    <div className="font-mono text-xs uppercase tracking-widest">No audit logs found</div>
                  </TableCell>
                </TableRow>
              ) : logs.map(log => {
                const colors = ACTION_COLORS[log.action] || { bg: 'rgba(148,163,184,0.12)', text: 'var(--text-mid)', border: 'rgba(148,163,184,0.3)' };
                return (
                  <TableRow key={log._id}>
                    <TableCell className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                      {relativeTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-mono font-semibold"
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.actor}</TableCell>
                    <TableCell className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>{log.target || '—'}</TableCell>
                    <TableCell className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>{log.ip || '—'}</TableCell>
                    <TableCell className="font-mono text-xs" style={{ color: 'var(--text-lo)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details && Object.keys(log.details).length > 0
                        ? JSON.stringify(log.details)
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {totalFiltered > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= totalFiltered} onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
