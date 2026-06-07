'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, RotateCcw, Search, AlertTriangle, KeyRound, Terminal, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Key {
  _id: string; game: string; userKey: string; duration: number | string;
  maxDevices: number; devices: string[]; status: number; registrator: string;
  expiredDate: string | null; createdAt: string;
}

export default function KeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Key[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ title: string; description: string; action: () => void } | null>(null);

  const fetchKeys = async (searchVal = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ draw: '1', start: '0', length: '50', 'search[value]': searchVal });
      const res = await fetch(`/api/keys?${params}`);
      const data = await res.json();
      setKeys(data.data || []);
    } catch {
      toast.error('Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchKeys(); }, []);

  if (user?.level !== 1 && user?.level !== 2) return <p className="text-muted-foreground">Access denied</p>;

  const showConfirm = (title: string, description: string, action: () => void) => {
    setConfirmData({ title, description, action });
    setConfirmOpen(true);
  };
  const handleConfirm = () => { if (confirmData?.action) confirmData.action(); setConfirmOpen(false); };
  const handleSearch = () => fetchKeys(search);
  const handleDelete = (id: string) => showConfirm('Delete Key', 'Are you sure you want to delete this key? This action cannot be undone.', async () => {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Key deleted'); fetchKeys(search); } else toast.error('Failed to delete key');
  });
  const handleReset = async (id: string) => {
    const res = await fetch(`/api/keys/reset?id=${id}`);
    if (res.ok) { toast.success('Devices reset'); fetchKeys(search); } else toast.error('Failed to reset devices');
  };
  const handleBulkDelete = (filter: 'unused' | 'expired', label: string) => showConfirm(
    `Clear ${label.charAt(0).toUpperCase() + label.slice(1)} Keys`,
    `Are you sure you want to delete ALL ${label} keys? This action cannot be undone.`,
    async () => {
      const res = await fetch('/api/keys/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(`Deleted ${data.deleted} ${label} keys`); fetchKeys(search); }
      else toast.error(data.error || `Failed to clear ${label} keys`);
    },
  );
  const formatDuration = (d: number | string) => {
    if (d === '1h') return '1 Hour';
    if (d === '3h') return '3 Hours';
    return `${d} Day${Number(d) > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Licence Management"
        title="KEY"
        highlight="REGISTRY"
        sub="Issue, track, and revoke licence keys across all games."
        actions={
          <Link href="/keys/generate">
            <Button>
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Generate
            </Button>
          </Link>
        }
      />

      <Card className="fade-up d1">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-lo)] pointer-events-none" />
                <Input
                  placeholder="// search by game, key, or registrator…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
            {user?.level === 1 && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('unused', 'unused')}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear Unused
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('expired', 'expired')}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear Expired
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registrator</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 font-mono text-xs">
                      <span className="inline-block size-2 rounded-full bg-[var(--teal-2)] animate-pulse" />
                      Loading keys…
                    </div>
                  </TableCell>
                </TableRow>
              ) : keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Terminal className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    <div className="font-mono text-xs uppercase tracking-widest">No keys in registry</div>
                  </TableCell>
                </TableRow>
              ) : keys.map(key => (
                <TableRow key={key._id}>
                  <TableCell className="font-mono">{key.game}</TableCell>
                  <TableCell>
                    <span className="key-chip">{key.userKey}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>
                      {formatDuration(key.duration)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold tabular-nums" style={{ color: 'var(--text-hi)' }}>
                        {key.devices?.length ?? 0}
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>/{key.maxDevices}</span>
                      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(20, 184, 184, 0.1)' }}>
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(((key.devices?.length ?? 0) / key.maxDevices) * 100, 100)}%`,
                            background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2))',
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.status === 1
                      ? <StatusBadge status="active" withDot>Active</StatusBadge>
                      : <StatusBadge status="blocked" withDot>Blocked</StatusBadge>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{key.registrator}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {key.expiredDate ? new Date(key.expiredDate).toLocaleDateString() : <span style={{ color: 'var(--text-lo)' }}>—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Link href={`/keys/${key._id}`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleReset(key._id)} title="Reset devices">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(key._id)} title="Delete key">
                        <Trash2 className="h-3.5 w-3.5 text-[var(--red)]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <AlertTriangle className="h-5 w-5 text-[var(--red)]" />
              </div>
              <DialogTitle>{confirmData?.title}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription>{confirmData?.description}</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
