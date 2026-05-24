'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, RotateCcw, Search, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Key { _id: string; game: string; userKey: string; duration: number | string; maxDevices: number; devices: string[]; status: number; registrator: string; expiredDate: string | null; createdAt: string; }

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
    } catch { toast.error('Failed to load keys');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, []);

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
  const handleBulkDelete = (filter: 'unused' | 'expired', label: string) => showConfirm(`Clear ${label.charAt(0).toUpperCase() + label.slice(1)} Keys`, `Are you sure you want to delete ALL ${label} keys? This action cannot be undone.`, async () => {
    const res = await fetch('/api/keys/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filter }) });
    const data = await res.json();
    if (res.ok) { toast.success(`Deleted ${data.deleted} ${label} keys`); fetchKeys(search); } else toast.error(data.error || `Failed to clear ${label} keys`);
  });
  const formatDuration = (d: number | string) => { if (d === '1h') return '1 Hour'; if (d === '3h') return '3 Hours'; return `${d} Day${Number(d) > 1 ? 's' : ''}`; };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Keys</h2>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <Link href="/keys/generate">
          <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25"><Plus className="h-4 w-4 mr-2" />Generate</Button>
        </Link>
      </div>

      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input placeholder="Search keys..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="max-w-sm bg-background/60 border-border/50" />
                <Button variant="outline" onClick={handleSearch} className="border-border/50"><Search className="h-4 w-4" /></Button>
              </div>
              {user?.level === 1 && (
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('unused', 'unused')}><Trash2 className="h-4 w-4 mr-2" />Clear Unused</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('expired', 'expired')}><Trash2 className="h-4 w-4 mr-2" />Clear Expired</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : keys.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No keys found</TableCell></TableRow>
                ) : keys.map(key => (
                  <TableRow key={key._id}>
                    <TableCell className="font-mono">{key.game}</TableCell>
                    <TableCell className="font-mono text-xs">{key.userKey}</TableCell>
                    <TableCell>{formatDuration(key.duration)}</TableCell>
                    <TableCell>{key.devices?.length ?? 0}/{key.maxDevices}</TableCell>
                    <TableCell><Badge variant={key.status === 1 ? 'default' : 'destructive'}>{key.status === 1 ? 'Active' : 'Blocked'}</Badge></TableCell>
                    <TableCell>{key.registrator}</TableCell>
                    <TableCell className="text-xs">{key.expiredDate ? new Date(key.expiredDate).toLocaleDateString() : 'Not used'}</TableCell>
                    <TableCell className="text-right"><div className="flex gap-1 justify-end">
                      <Link href={`/keys/${key._id}`}><Button variant="ghost" size="sm">Edit</Button></Link>
                      <Button variant="ghost" size="sm" onClick={() => handleReset(key._id)} title="Reset devices"><RotateCcw className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(key._id)} title="Delete key"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border-border/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <DialogTitle>{confirmData?.title}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription>{confirmData?.description}</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
