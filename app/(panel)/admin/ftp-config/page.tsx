'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Server, Eye, EyeOff, Tag, HardDrive, KeyRound, FolderTree, Activity, Pencil } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

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
    remotePath: '/htdocs/', isActive: true, order: 0, diskLimit: 5, inodeLimit: 80000,
  });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/ftp-config');
        if (res.ok) setConfigs(await res.json());
      } catch {}
    })();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/admin/ftp-config');
      if (res.ok) setConfigs(await res.json());
    } catch {}
  };

  const openNew = () => {
    setEditing(null);
    setForm({ label: '', host: '', user: '', password: '', port: 21, remotePath: '/htdocs/', isActive: true, order: configs.length, diskLimit: 5, inodeLimit: 80000 });
    setShowPw(false);
    setDialogOpen(true);
  };

  const openEdit = (cfg: FtpConfig) => {
    setEditing(cfg);
    setForm({
      label: cfg.label, host: cfg.host, user: cfg.user, password: '••••••',
      port: cfg.port, remotePath: cfg.remotePath, isActive: cfg.isActive, order: cfg.order,
      diskLimit: Math.round(cfg.diskLimit / (1024 * 1024 * 1024)) || 5,
      inodeLimit: cfg.inodeLimit || 80000,
    });
    setShowPw(false);
    setDialogOpen(true);
  };

  const save = async () => {
    const body: Record<string, unknown> = {
      ...form, diskLimit: form.diskLimit * 1024 * 1024 * 1024,
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
      void fetchConfigs();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this FTP config?')) return;
    await fetch(`/api/admin/ftp-config?id=${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    void fetchConfigs();
  };

  if (!user || user.level !== 1) return <p className="text-muted-foreground">Unauthorized</p>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Remote Storage"
        title="FTP"
        highlight="CONFIG"
        sub="Manage FTP host credentials, disk quotas, and inode limits for lib uploads."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add FTP
          </Button>
        }
      />

      <div className="grid gap-3">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="empty-state">
              <div className="empty-icon-ring"><Server size={26} /></div>
              <div className="empty-title">No FTP Configs</div>
              <div className="empty-sub">Add your first remote storage target to start uploading libs.</div>
            </CardContent>
          </Card>
        ) : configs.map(cfg => (
          <Card key={cfg._id} className="fade-up">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2 text-sm min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Server className="h-4 w-4 shrink-0" style={{ color: cfg.isActive ? 'var(--teal-2)' : 'var(--text-lo)' }} />
                    <span className="font-display font-bold tracking-wide" style={{ color: 'var(--text-hi)' }}>{cfg.label || cfg.host}</span>
                    {!cfg.isActive && <StatusBadge status="neutral">Disabled</StatusBadge>}
                  </div>
                  <div className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>
                    {cfg.user}@{cfg.host}:{cfg.port}
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> {fmtBytes(cfg.diskLimit || 5 * 1024 * 1024 * 1024)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderTree className="h-3 w-3" style={{ color: 'var(--gold)' }} /> {(cfg.inodeLimit || 80000).toLocaleString()} inodes
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cfg)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--teal-3)' }} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => void remove(cfg._id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit FTP' : 'Add FTP'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Label</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="// e.g. Main Server" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Host *</Label>
                <Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="// ftpupload.net" className="mt-1.5" />
              </div>
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Port</Label>
                <Input type="number" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 21 })} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Username *</Label>
                <Input value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Password *</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1.5 pr-9" />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-mid)' }} onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Remote Path</Label>
              <Input value={form.remotePath} onChange={e => setForm({ ...form, remotePath: e.target.value })} placeholder="// /htdocs/" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Disk Limit (GB)</Label>
                <Input type="number" value={form.diskLimit} onChange={e => setForm({ ...form, diskLimit: parseFloat(e.target.value) || 0 })} className="mt-1.5" />
              </div>
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Inode Limit</Label>
                <Input type="number" value={form.inodeLimit} onChange={e => setForm({ ...form, inodeLimit: parseInt(e.target.value) || 0 })} className="mt-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>Active</Label>
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
