'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, RotateCcw, Search, AlertTriangle, KeyRound, Terminal, ShieldCheck, ChevronLeft, ChevronRight, Clock, X, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useDebouncedCallback } from '@/lib/hooks';

interface Key {
  _id: string; game: string; userKey: string; duration: number | string;
  maxDevices: number; devices: string[]; status: number; registrator: string;
  expiredDate: string | null; createdAt: string;
}

const DURATION_OPTIONS = [
  { label: '1 Hour', value: 1 },
  { label: '3 Hours', value: 3 },
  { label: '1 Day', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: 'Lifetime', value: 36500 },
];

export default function KeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Key[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const [page, setPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendDuration, setExtendDuration] = useState(1);
  const [bulkExtending, setBulkExtending] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const PAGE_SIZE = 50;

  const fetchKeys = async (searchVal = '', pageVal = 1) => {
    setLoading(true);
    try {
      const start = (pageVal - 1) * PAGE_SIZE;
      const params = new URLSearchParams({ draw: '1', start: String(start), length: String(PAGE_SIZE), 'search[value]': searchVal });
      const res = await fetch(`/api/keys?${params}`);
      const data = await res.json();
      setKeys(data.data || []);
      setTotalFiltered(data.recordsFiltered ?? 0);
    } catch {
      toast.error('Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useDebouncedCallback((val: string) => { setPage(1); fetchKeys(val, 1); }, 400);

  useEffect(() => { void fetchKeys(); }, []);

  if (!user) return <p className="text-muted-foreground">Loading…</p>;

  const showConfirm = (title: string, description: string, action: () => void) => {
    setConfirmData({ title, description, action });
    setConfirmOpen(true);
  };
  
  const handleConfirm = () => { if (confirmData?.action) confirmData.action(); setConfirmOpen(false); };
  const handleSearch = () => { setPage(1); fetchKeys(search, 1); };
  
  const handleDelete = (id: string) => showConfirm('Delete Key', 'Are you sure you want to delete this key? This action cannot be undone.', async () => {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Key deleted'); fetchKeys(search, page); } else toast.error('Failed to delete key');
  });

  const handleReset = async (id: string) => {
    const res = await fetch('/api/keys/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success('Devices reset'); fetchKeys(search, page); } else toast.error('Failed to reset devices');
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
      if (res.ok) { toast.success(`Deleted ${data.deleted} ${label} keys`); fetchKeys(search, page); }
      else toast.error(data.error || `Failed to clear ${label} keys`);
    },
  );

  const formatDuration = (d: number | string) => {
    if (d === '1h') return '1 Hour';
    if (d === '3h') return '3 Hours';
    if (d === 'lifetime') return 'Lifetime';
    return `${d} Day${Number(d) > 1 ? 's' : ''}`;
  };

  const allVisibleSelected = keys.length > 0 && keys.every(k => selectedKeys.has(k._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(keys.map(k => k._id)));
    }
  };

  const toggleKey = (id: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deselectAll = () => setSelectedKeys(new Set());

  const handleBulkExtend = () => {
    if (selectedKeys.size === 0) return;
    setExtendDuration(1);
    setExtendDialogOpen(true);
  };

  const confirmBulkExtend = async () => {
    if (selectedKeys.size === 0) return;
    setBulkExtending(true);
    try {
      const res = await fetch('/api/keys/bulk-extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyIds: Array.from(selectedKeys), additionalDays: extendDuration }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Extended ${data.extended} keys by ${extendDuration} days`);
        setSelectedKeys(new Set());
        setExtendDialogOpen(false);
        fetchKeys(search, page);
      } else {
        toast.error(data.error || 'Failed to extend keys');
      }
    } catch {
      toast.error('Failed to extend keys');
    } finally {
      setBulkExtending(false);
    }
  };

  const handleBulkDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    showConfirm(
      'Delete Selected Keys',
      `Are you sure you want to delete ${selectedKeys.size} selected key(s)? This action cannot be undone.`,
      async () => {
        setBulkDeleting(true);
        try {
          const res = await fetch('/api/keys/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedKeys) }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(`Deleted ${data.deleted} keys`);
            setSelectedKeys(new Set());
            fetchKeys(search, page);
          } else {
            toast.error(data.error || 'Failed to delete keys');
          }
        } catch {
          toast.error('Failed to delete keys');
        } finally {
          setBulkDeleting(false);
        }
      },
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Licence Management"
        title="KEY"
        highlight="REGISTRY"
        sub="Issue, track, and revoke licence keys across all games."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_2.4fr] items-start">
        {/* Left Column: Tactical Control HUD */}
        <div className="space-y-4 fade-up d1 animate-in">
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">
                <KeyRound size={14} className="text-orange-500 animate-pulse" />
                <span>Console Registry</span>
              </h2>
              <span className="panel-badge">SECURE</span>
            </div>
            
            <div className="p-4 space-y-4 font-sans text-xs">
              <div className="rounded-lg p-3 bg-black/25 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Reseller Balance</span>
                <div className="text-xl font-extrabold text-white font-display flex items-baseline gap-1">
                  {user.saldo} <span className="text-[10px] text-orange-500 uppercase tracking-widest font-mono">Credits</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded border border-white/5 bg-white/[0.01] p-2">
                  <div className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">Total Active</div>
                  <div className="text-base font-bold text-orange-500 mt-1">{totalFiltered}</div>
                </div>
                <div className="rounded border border-white/5 bg-white/[0.01] p-2">
                  <div className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">Filtered View</div>
                  <div className="text-base font-bold text-white mt-1">{keys.length}</div>
                </div>
              </div>

              <Link href="/keys/generate" className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 text-center">
                <Terminal size={14} />
                Forge Licence Keys
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Database Registry Grid */}
        <Card className="fade-up d2">
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
            {/* Bulk Actions Toolbar */}
            {selectedKeys.size > 0 && (
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  borderColor: 'var(--border)',
                  background: 'rgba(234, 88, 12, 0.08)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--teal-2)' }}
                  >
                    {selectedKeys.size} key{selectedKeys.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkExtend}
                    disabled={bulkExtending}
                    style={{ background: 'var(--teal-2)', color: 'var(--background)' }}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Extend Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDeleteSelected}
                    disabled={bulkDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Deselect All
                  </Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <label className="relative flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="peer sr-only"
                      />
                      <div
                        className="h-4 w-4 rounded border transition-all flex items-center justify-center peer-checked:border-[var(--teal-2)] peer-checked:bg-[var(--teal-2)]"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <Check className="h-2.5 w-2.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                      </div>
                    </label>
                  </TableHead>
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
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2 font-mono text-xs">
                        <span className="inline-block size-2 rounded-full bg-[var(--teal-2)] animate-pulse" />
                        Loading keys…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <Terminal className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      <div className="font-mono text-xs uppercase tracking-widest">No keys in registry</div>
                    </TableCell>
                  </TableRow>
                ) : keys.map(key => (
                  <TableRow key={key._id} className={selectedKeys.has(key._id) ? 'bg-white/[0.015]' : ''}>
                    <TableCell className="w-10">
                      <label className="relative flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(key._id)}
                          onChange={() => toggleKey(key._id)}
                          className="peer sr-only"
                        />
                        <div
                          className="h-4 w-4 rounded border transition-all flex items-center justify-center peer-checked:border-[var(--teal-2)] peer-checked:bg-[var(--teal-2)]"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Check className="h-2.5 w-2.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                        </div>
                      </label>
                    </TableCell>
                    <TableCell className="font-semibold text-white">{key.game}</TableCell>
                    <TableCell className="font-mono">
                      <span
                        className="key-chip"
                        onClick={() => {
                          void navigator.clipboard.writeText(key.userKey);
                          toast.success('Key copied to clipboard');
                        }}
                      >
                        {key.userKey}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatDuration(key.duration)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {key.devices && key.devices.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-orange-500 font-semibold tracking-wider uppercase">Active HWID:</span>
                          <span className="truncate max-w-[150px]" title={key.devices.join(', ')}>{key.devices.join(', ')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(234, 88, 12, 0.1)' }} />
                          <span className="text-[9px] text-[var(--text-lo)] uppercase tracking-widest font-mono">No Device</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={key.status === 1 ? 'success' : key.status === 2 ? 'warning' : 'danger'} withDot>
                        {key.status === 1 ? 'Active' : key.status === 2 ? 'Expired' : 'Blocked'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{key.registrator}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {key.expiredDate ? (
                        new Date(key.expiredDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded-md animate-pulse"
                          style={{ background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.3)' }}
                        >
                          LIFETIME
                        </span>
                      )}
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
                ))
              }
            </TableBody>
          </Table>
          {totalFiltered > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchKeys(search, p); }}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= totalFiltered} onClick={() => { const p = page + 1; setPage(p); fetchKeys(search, p); }}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Confirm Dialog */}
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

      {/* Bulk Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.3)' }}
              >
                <Clock className="h-5 w-5" style={{ color: 'var(--teal-2)' }} />
              </div>
              <DialogTitle>Extend Selected Keys</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription>
            Choose a duration to extend {selectedKeys.size} selected key(s) by.
          </DialogDescription>
          <div className="grid grid-cols-2 gap-2 py-2">
            {DURATION_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={extendDuration === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExtendDuration(opt.value)}
                className="justify-center font-mono text-xs"
                style={
                  extendDuration === opt.value
                    ? { background: 'var(--teal-2)', color: 'var(--background)' }
                    : {}
                }
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmBulkExtend} disabled={bulkExtending}>
              {bulkExtending ? 'Extending…' : 'Confirm Extend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
