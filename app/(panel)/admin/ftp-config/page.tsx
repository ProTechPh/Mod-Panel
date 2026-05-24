'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Server, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';

interface FtpConfig {
  _id: string;
  label: string;
  host: string;
  user: string;
  password: string;
  port: number;
  remotePath: string;
  isActive: boolean;
  order: number;
  diskLimit: number;
  inodeLimit: number;
}

function fmtBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

export default function FtpConfigPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<FtpConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FtpConfig | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    label: '', host: '', user: '', password: '', port: 21,
    remotePath: '/htdocs/',
    isActive: true, order: 0,
    diskLimit: 5,
    inodeLimit: 80000,
  });

  const fetchConfigs = async () => {
    const res = await fetch('/api/admin/ftp-config');
    if (res.ok) setConfigs(await res.json());
  };

  useEffect(() => { fetchConfigs(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ label: '', host: '', user: '', password: '', port: 21, remotePath: '/htdocs/', isActive: true, order: configs.length, diskLimit: 5, inodeLimit: 80000 });
    setShowPw(false);
    setDialogOpen(true);
  };

  const openEdit = (cfg: FtpConfig) => {
    setEditing(cfg);
    setForm({
      label: cfg.label,
      host: cfg.host,
      user: cfg.user,
      password: '••••••',
      port: cfg.port,
      remotePath: cfg.remotePath,
      isActive: cfg.isActive,
      order: cfg.order,
      diskLimit: Math.round(cfg.diskLimit / (1024 * 1024 * 1024)) || 5,
      inodeLimit: cfg.inodeLimit || 80000,
    });
    setShowPw(false);
    setDialogOpen(true);
  };

  const save = async () => {
    const body: any = {
      ...form,
      diskLimit: form.diskLimit * 1024 * 1024 * 1024,
    };
    if (editing) body._id = editing._id;

    const res = await fetch('/api/admin/ftp-config', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editing ? 'Updated' : 'Created');
      setDialogOpen(false);
      fetchConfigs();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this FTP config?')) return;
    await fetch(`/api/admin/ftp-config?id=${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    fetchConfigs();
  };

  if (!user || user.level !== 1) return <p className="text-muted-foreground">Unauthorized</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
          <Sparkles className="h-4 w-4 text-purple-400 inline mr-2" />
          FTP Configurations
        </h2>
        <Button onClick={openNew} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
          <Plus className="h-4 w-4 mr-2" />Add FTP
        </Button>
      </div>

      <div className="grid gap-3">
        {configs.map(cfg => (
          <div key={cfg._id} className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{cfg.label || cfg.host}</span>
                      {!cfg.isActive && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    </div>
                    <p className="text-muted-foreground">{cfg.user}@{cfg.host}:{cfg.port}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtBytes(cfg.diskLimit)} disk &middot; {(cfg.inodeLimit || 80000).toLocaleString()} inodes
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cfg)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(cfg._id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        {configs.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No FTP configs yet.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-border/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit FTP' : 'Add FTP'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Label</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Main Server" className="bg-background/60 border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Host *</Label>
                <Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="ftpupload.net" className="bg-background/60 border-border/50" />
              </div>
              <div>
                <Label>Port</Label>
                <Input type="number" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 21 })} className="bg-background/60 border-border/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Username *</Label>
                <Input value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} className="bg-background/60 border-border/50" />
              </div>
              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="bg-background/60 border-border/50"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label>Remote Path</Label>
              <Input value={form.remotePath} onChange={e => setForm({ ...form, remotePath: e.target.value })} placeholder="/htdocs/" className="bg-background/60 border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Disk Limit (GB)</Label>
                <Input type="number" value={form.diskLimit} onChange={e => setForm({ ...form, diskLimit: parseFloat(e.target.value) || 0 })} className="bg-background/60 border-border/50" />
              </div>
              <div>
                <Label>Inode Limit</Label>
                <Input type="number" value={form.inodeLimit} onChange={e => setForm({ ...form, inodeLimit: parseInt(e.target.value) || 0 })} className="bg-background/60 border-border/50" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
            <Button onClick={save} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
