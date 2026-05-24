'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Check, Clock, User, Smartphone, AlertCircle, RefreshCw,
  TrendingUp, Users, Calendar, Sparkles
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

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
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [registrarForm, setRegistrarForm] = useState({
    tiktokUsername: '',
    streamerName: '',
    contact: ''
  });

  const filteredStreamers = streamers.filter(s => {
    const matchesSearch = 
      s.tiktokUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.streamerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return s.status === filter && matchesSearch;
  });

  useEffect(() => {
    if (!user) return;
    fetchStreamers();
  }, [user, filter]);

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
    } catch {
      toast.error('Failed to load streamers');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await fetch('/api/tiktok-live-streamers', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.key);
        toast.success('License key generated!');
        fetchStreamers();
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch {
      toast.error('Failed to generate key');
    }
  };

  const handleDelete = async (streamerId: string) => {
    if (!confirm('Delete this streamer?')) return;
    try {
      const res = await fetch(`/api/tiktok-live-streamers?id=${streamerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Streamer deleted');
        fetchStreamers();
      } else {
        toast.error(data.error || 'Failed to delete streamer');
      }
    } catch {
      toast.error('Failed to delete streamer');
    }
  };

  const handleToggleExtend = async (streamerId: string, current: boolean) => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: streamerId,
          autoExtendEnabled: !current,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Auto-extend ${!current ? 'enabled' : 'disabled'}`);
        fetchStreamers();
      } else {
        toast.error(data.error || 'Failed to update auto-extend');
      }
    } catch {
      toast.error('Failed to update auto-extend');
    }
  };

  const startLive = async (streamerId: string) => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: streamerId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Live session started!');
        if (data.extended) toast.success('Key auto-extended by 7 days!');
        fetchStreamers();
      } else {
        toast.error(data.error || 'Failed to start live session');
      }
    } catch {
      toast.error('Failed to start live session');
    }
  };

  const handleExtend = async (id: string, key: string) => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Key duration extended!');
        fetchStreamers();
      } else {
        toast.error(data.error || 'Failed to extend key');
      }
    } catch {
      toast.error('Failed to extend key');
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/tiktok-live-streamers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStreamer?._id,
          tiktokUsername: registrarForm.tiktokUsername,
          streamerName: registrarForm.streamerName,
          contact: registrarForm.contact,
        }),
      });

      if (res.ok) {
        toast.success(editingStreamer ? 'Streamer updated' : 'Streamer registered');
        setShowEditDialog(false);
        fetchStreamers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      active: 'bg-green-500/15 text-green-400 border-green-500/30',
      inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
      expired: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (!user || (user.level !== 1 && user.level !== 2)) {
    return <div className="text-muted-foreground p-8">Access denied</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">TikTok Live Streamers</h2>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={(open) => {
          setShowGenerateDialog(open);
          if (!open) {
            setGeneratedKey(null);
          }
        }}>
          <DialogTrigger render={
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
              <Plus className="h-4 w-4 mr-2" />
              Generate Key
            </Button>
          } />
          <DialogContent className="sm:max-w-md border-border/30 bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Generate Streamer Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!generatedKey ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Generating a new license key will create a pending entry in the list. 
                    The streamer will use this key to register their own details.
                  </p>
                  <Button onClick={handleGenerateKey} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
                    Confirm Generation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg flex flex-col items-center gap-2 border border-purple-500/20">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New License Key</span>
                    <code className="text-2xl font-bold tracking-widest bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">{generatedKey}</code>
                  </div>
                  <p className="text-xs text-center text-amber-500">
                    Copy and send this key to the streamer. They must use it to complete their profile.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-500/30 hover:bg-purple-500/10" 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      toast.success('Key copied to clipboard');
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streamers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streamers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All registered streamers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Streamers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {streamers.filter(s => s.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently live or recently active
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Live Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(streamers.reduce((acc, s) => acc + s.liveDuration, 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Combined live duration
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search streamers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-64 bg-background/60 border-border/50"
            />
            <Select value={filter} onValueChange={v => setFilter(v as any)}>
              <SelectTrigger className="w-40 bg-background/60 border-border/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
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
                        <TableCell colSpan={7} className="text-center py-8">
                          No streamers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStreamers.map(streamer => (
                        <TableRow key={streamer._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{streamer.streamerName}</span>
                              <span className="text-sm text-muted-foreground">@{streamer.tiktokUsername}</span>
                              <span className="text-xs text-muted-foreground">{streamer.contact}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{streamer.key}</TableCell>
                          <TableCell>
                            <Badge className={statusColor(streamer.status)}>
                              {streamer.status.charAt(0).toUpperCase() + streamer.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTime(streamer.liveDuration)}</TableCell>
                          <TableCell>
                            {streamer.lastLive ? (
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {new Date(streamer.lastLive).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(streamer.lastLiveDuration)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleExtend(streamer._id, streamer.autoExtendEnabled)}
                              className="h-8 w-8 p-0"
                            >
                              {streamer.autoExtendEnabled ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingStreamer(streamer);
                                  setRegistrarForm({
                                    tiktokUsername: streamer.tiktokUsername,
                                    streamerName: streamer.streamerName,
                                    contact: streamer.contact
                                  });
                                  setShowEditDialog(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startLive(streamer._id)}
                              >
                                <RefreshCw className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExtend(streamer._id, streamer.key)}
                                title="Extend Key"
                              >
                                <Clock className="h-4 w-4 text-purple-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(streamer._id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md border-border/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit Streamer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>TikTok Username</Label>
              <Input
                value={registrarForm.tiktokUsername}
                onChange={e => setRegistrarForm({ ...registrarForm, tiktokUsername: e.target.value })}
                placeholder="@username"
                className="bg-background/60 border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                value={registrarForm.streamerName}
                onChange={e => setRegistrarForm({ ...registrarForm, streamerName: e.target.value })}
                placeholder="Streamer name"
                className="bg-background/60 border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Input
                value={registrarForm.contact}
                onChange={e => setRegistrarForm({ ...registrarForm, contact: e.target.value })}
                placeholder="Telegram or phone"
                className="bg-background/60 border-border/50"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-purple-500/30 hover:bg-purple-500/10"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
