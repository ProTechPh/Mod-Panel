'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Server, Eye, EyeOff, HardDrive, BarChart3 } from 'lucide-react';
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
  libBaseUrl: string;
  statsUrl: string;
  scanPaths: string[];
  isActive: boolean;
  isLibStorage: boolean;
  order: number;
}

export default function FtpConfigPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<FtpConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FtpConfig | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    label: '', host: '', user: '', password: '', port: 21,
    remotePath: '/htdocs/', libBaseUrl: '', statsUrl: '',
    scanPaths: '', isActive: true, isLibStorage: false, order: 0,
  });

  const fetchConfigs = async () => {
    const res = await fetch('/api/admin/ftp-config');
    if (res.ok) setConfigs(await res.json());
  };

  useEffect(() => { fetchConfigs(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ label: '', host: '', user: '', password: '', port: 21, remotePath: '/htdocs/', libBaseUrl: '', statsUrl: '', scanPaths: '', isActive: true, isLibStorage: false, order: configs.length });
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
      libBaseUrl: cfg.libBaseUrl,
      statsUrl: cfg.statsUrl,
      scanPaths: (cfg.scanPaths || []).join('\n'),
      isActive: cfg.isActive,
      isLibStorage: cfg.isLibStorage,
      order: cfg.order,
    });
    setShowPw(false);
    setDialogOpen(true);
  };

  const save = async () => {
    const body: any = { ...form };
    body.scanPaths = form.scanPaths.split('\n').filter(Boolean).map(s => s.trim());
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
        <h2 className="text-2xl font-bold tracking-tight">FTP Configurations</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add FTP</Button>
      </div>

      <div className="grid gap-3">
        {configs.map(cfg => (
          <Card key={cfg._id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{cfg.label || cfg.host}</span>
                    {!cfg.isActive && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    {cfg.isLibStorage && <Badge className="text-xs bg-primary">Lib Storage</Badge>}
                  </div>
                  <p className="text-muted-foreground">{cfg.user}@{cfg.host}:{cfg.port}</p>
                  {cfg.libBaseUrl && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <HardDrive className="h-3.5 w-3.5" /> Lib URL: {cfg.libBaseUrl}
                    </p>
                  )}
                  {cfg.statsUrl && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" /> Stats: {cfg.statsUrl}
                    </p>
                  )}
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
        ))}
        {configs.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No FTP configs yet.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit FTP' : 'Add FTP'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Label</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. InfinityFree Main" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Host *</Label>
                <Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="ftpupload.net" />
              </div>
              <div>
                <Label>Port</Label>
                <Input type="number" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 21 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Username *</Label>
                <Input value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} />
              </div>
              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
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
              <Input value={form.remotePath} onChange={e => setForm({ ...form, remotePath: e.target.value })} placeholder="/htdocs/" />
            </div>
            <div>
              <Label>Lib Base URL (for serving .so files)</Label>
              <Input value={form.libBaseUrl} onChange={e => setForm({ ...form, libBaseUrl: e.target.value })} placeholder="https://mod.kesug.com/onlinelibs" />
            </div>
            <div>
              <Label>Stats URL (stats.php)</Label>
              <Input value={form.statsUrl} onChange={e => setForm({ ...form, statsUrl: e.target.value })} placeholder="http://mod.kesug.com/stats.php" />
            </div>
            <div>
              <Label>Extra scan paths (one per line)</Label>
              <textarea className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.scanPaths}
                onChange={e => setForm({ ...form, scanPaths: e.target.value })}
                placeholder="/mod.kesug.com/" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isLibStorage} onCheckedChange={v => setForm({ ...form, isLibStorage: v })} />
              <Label>Lib Storage — upload/download .so files here</Label>
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
