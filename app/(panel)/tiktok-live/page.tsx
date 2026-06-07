'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Check, Clock, User, AlertCircle, RefreshCw,
  TrendingUp, Users, Video, Key, AtSign, Phone, Copy, Search
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Streamer {
  _id: string;
  key: string;
  tiktokUsername: string;
  streamerName: string;
  contact: string;
  status: 'pending' | 'active' | 'inactive' | 'expired';
  registrator: string;
  liveDuration: number;
  lastLive: string;
  lastLiveDuration: number;
  autoExtendEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TikTokLivePage() {
  const { user } = useAuth();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [registrarForm, setRegistrarForm] = useState({ tiktokUsername: '', streamerName: '', contact: '' });

  const filteredStreamers = streamers.filter(s => {
    const matchesSearch =
      s.tiktokUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.streamerName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return s.status === filter && matchesSearch;
  });

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tiktok-live-streamers');
        if (res.ok) {
          const data = await res.json();
          setStreamers(Array.isArray(data) ? data : []);
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || 'Failed to load streamers');
        }
      } catch { toast.error('Failed to load streamers'); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const fetchStreamers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tiktok-live-streamers');
      if (res.ok) {
        const data = await res.json();
        setStreamers(Array.isArray(data) ? data : []);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to load streamers');
      }
    } catch { toast.error('Failed to load streamers'); }
    finally { setLoading(false); }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await fetch('/api/tiktok-live-streamers', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.key);
        toast.success('License key generated!');
        void fetchStreamers();
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch { toast.error('Failed to generate key'); }
  };

  const handleDelete = async (streamerId: string) => {
    if (!confirm('Delete this streamer?')) return;
    try {
      const res = await fetch(`/api/tiktok-live-streamers?id=${streamerId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Streamer deleted'); void fetchStreamers(); }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Failed to delete streamer'); }
    } catch { toast.error('Failed to delete streamer'); }
  };

  const handleToggleExtend = async (streamerId: string, current: boolean) => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: streamerId, autoExtendEnabled: !current }),
      });
      if (res.ok) { toast.success(`Auto-extend ${!current ? 'enabled' : 'disabled'}`); void fetchStreamers(); }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Failed to update auto-extend'); }
    } catch { toast.error('Failed to update auto-extend'); }
  };

  const startLive = async (streamerId: string) => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/live', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: streamerId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Live session started!');
        if (data.extended) toast.success('Key auto-extended by 7 days!');
        void fetchStreamers();
      } else { toast.error(data.error || 'Failed to start live session'); }
    } catch { toast.error('Failed to start live session'); }
  };

  const handleExtend = async (_id: string, key: string) => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/extend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (res.ok) { toast.success('Key duration extended!'); void fetchStreamers(); }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Failed to extend key'); }
    } catch { toast.error('Failed to extend key'); }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStreamer?._id,
          tiktokUsername: registrarForm.tiktokUsername,
          streamerName: registrarForm.streamerName,
          contact: registrarForm.contact,
        }),
      });
      if (res.ok) { toast.success(editingStreamer ? 'Streamer updated' : 'Streamer registered'); setShowEditDialog(false); void fetchStreamers(); }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Failed to save'); }
    } catch { toast.error('An error occurred while saving'); }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const statusKind = (s: Streamer['status']): 'active' | 'pending' | 'offline' | 'blocked' =>
    s === 'active' ? 'active' : s === 'pending' ? 'pending' : s === 'expired' ? 'blocked' : 'offline';

  if (!user || (user.level !== 1 && user.level !== 2)) {
    return <div className="text-muted-foreground p-8">Access denied</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Creator Network"
        title="TIKTOK"
        highlight="LIVE"
        sub="Manage live-streamer license keys, auto-extend policies, and contact data."
        actions={
          <Dialog open={showGenerateDialog} onOpenChange={(open) => { setShowGenerateDialog(open); if (!open) setGeneratedKey(null); }}>
            <DialogTrigger render={
              <Button>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Generate Key
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  <Key className="inline h-4 w-4 mr-1.5" style={{ color: 'var(--teal-2)' }} />
                  Generate Streamer Key
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {!generatedKey ? (
                  <div className="space-y-4">
                    <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
                      Generating a new license key will create a pending entry in the list. The streamer will use this key to register their own details.
                    </p>
                    <Button onClick={handleGenerateKey} className="w-full">
                      <Check className="h-3.5 w-3.5 mr-1.5" /> Confirm Generation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className="p-5 flex flex-col items-center gap-2"
                      style={{
                        background: 'rgba(20, 184, 184, 0.05)',
                        border: '1px solid rgba(20, 184, 184, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 0 20px rgba(20, 184, 184, 0.15)',
                      }}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-lo)' }}>New License Key</span>
                      <code
                        className="text-2xl font-bold tracking-widest font-mono"
                        style={{
                          background: 'linear-gradient(135deg, var(--teal-3), var(--teal-neon))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >{generatedKey}</code>
                    </div>
                    <p className="font-mono text-xs text-center" style={{ color: 'var(--gold)' }}>
                      {'// copy and send this key to the streamer. they must use it to complete their profile.'}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { void navigator.clipboard.writeText(generatedKey); toast.success('Key copied to clipboard'); }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy to Clipboard
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="stat-card stat-card--teal fade-up d1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Total Streamers</CardTitle>
            <div className="stat-icon" style={{ background: 'rgba(20, 184, 184, 0.12)', color: 'var(--teal-2)' }}>
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{streamers.length}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-lo)' }}>All registered streamers</p>
          </CardContent>
        </Card>
        <Card className="stat-card stat-card--green fade-up d2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Active Streamers</CardTitle>
            <div className="stat-icon" style={{ background: 'rgba(57, 255, 20, 0.12)', color: 'var(--ecto-green)' }}>
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value" style={{ color: 'var(--ecto-green)' }}>{streamers.filter(s => s.status === 'active').length}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-lo)' }}>Currently live or recently active</p>
          </CardContent>
        </Card>
        <Card className="stat-card stat-card--gold fade-up d3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Total Live Time</CardTitle>
            <div className="stat-icon" style={{ background: 'rgba(240, 192, 64, 0.12)', color: 'var(--gold)' }}>
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>{formatTime(streamers.reduce((acc, s) => acc + s.liveDuration, 0))}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-lo)' }}>Combined live duration</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--text-lo)' }} />
              <Input
                placeholder="// search streamers…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
            <Select value={filter} onValueChange={v => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={filter === 'all' ? 'all' : filter === 'active' ? 'active' : filter === 'inactive' ? 'inactive' : 'pending'} className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: 'var(--teal-2)' }} />
            </div>
          ) : (
            <Card className="fade-up">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Streamer</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Live Time</TableHead>
                      <TableHead>Last Live</TableHead>
                      <TableHead>Auto-Extend</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStreamers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="empty-state" style={{ padding: '1rem' }}>
                            <div className="empty-icon-ring"><Video size={22} /></div>
                            <div className="empty-title">No Streamers Found</div>
                            <div className="empty-sub">Generate a key to add a streamer.</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredStreamers.map(streamer => (
                      <TableRow key={streamer._id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium" style={{ color: 'var(--text-hi)' }}>{streamer.streamerName}</span>
                            <span className="flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--teal-3)' }}>
                              <AtSign className="h-3 w-3" /> {streamer.tiktokUsername}
                            </span>
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-lo)' }}>
                              <Phone className="h-3 w-3" /> {streamer.contact || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell><span className="key-chip">{streamer.key}</span></TableCell>
                        <TableCell><StatusBadge status={statusKind(streamer.status)} withDot>{streamer.status.charAt(0).toUpperCase() + streamer.status.slice(1)}</StatusBadge></TableCell>
                        <TableCell className="font-mono text-xs">{formatTime(streamer.liveDuration)}</TableCell>
                        <TableCell>
                          {streamer.lastLive ? (
                            <div className="flex flex-col">
                              <span className="text-sm">{new Date(streamer.lastLive).toLocaleDateString()}</span>
                              <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>{formatTime(streamer.lastLiveDuration)}</span>
                            </div>
                          ) : (
                            <span className="text-xs italic" style={{ color: 'var(--text-lo)' }}>Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon-sm"
                            onClick={() => void handleToggleExtend(streamer._id, streamer.autoExtendEnabled)}
                            title={streamer.autoExtendEnabled ? 'Auto-extend enabled' : 'Auto-extend disabled'}
                          >
                            {streamer.autoExtendEnabled
                              ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} />
                              : <AlertCircle className="h-3.5 w-3.5" style={{ color: 'var(--text-lo)' }} />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm"
                              onClick={() => { setEditingStreamer(streamer); setRegistrarForm({ tiktokUsername: streamer.tiktokUsername, streamerName: streamer.streamerName, contact: streamer.contact }); setShowEditDialog(true); }}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--teal-3)' }} />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => void startLive(streamer._id)} title="Start live">
                              <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--teal-2)' }} />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => void handleExtend(streamer._id, streamer.key)} title="Extend key">
                              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => void handleDelete(streamer._id)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <User className="inline h-4 w-4 mr-1.5" style={{ color: 'var(--teal-2)' }} />
              Edit Streamer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <AtSign className="inline h-3 w-3 mr-1" /> TikTok Username
              </Label>
              <Input value={registrarForm.tiktokUsername} onChange={e => setRegistrarForm({ ...registrarForm, tiktokUsername: e.target.value })} placeholder="// @username" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Display Name</Label>
              <Input value={registrarForm.streamerName} onChange={e => setRegistrarForm({ ...registrarForm, streamerName: e.target.value })} placeholder="// Streamer name" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Phone className="inline h-3 w-3 mr-1" /> Contact
              </Label>
              <Input value={registrarForm.contact} onChange={e => setRegistrarForm({ ...registrarForm, contact: e.target.value })} placeholder="// Telegram or phone" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
