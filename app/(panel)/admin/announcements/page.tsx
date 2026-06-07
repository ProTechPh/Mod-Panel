'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Megaphone, Pencil, User, Calendar, Hash, Pin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Announcement { _id: string; title: string; content: string; isActive: boolean; priority: number; createdBy: string; createdAt: string; }

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isActive: true, priority: 0 });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/announcements');
        if (res.ok) setAnnouncements(await res.json());
      } catch {}
    })();
  }, []);

  const openNew = () => { setEditing(null); setForm({ title: '', content: '', isActive: true, priority: 0 }); setDialogOpen(true); };
  const openEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, content: a.content, isActive: a.isActive, priority: a.priority }); setDialogOpen(true); };
  const save = async () => {
    const body: Record<string, unknown> = { ...form };
    if (editing) body._id = editing._id;
    const res = await fetch('/api/admin/announcements', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setDialogOpen(false); void load(); } else { const err = await res.json(); toast.error(err.error || 'Failed'); }
  };
  const load = async () => { try { const res = await fetch('/api/admin/announcements'); if (res.ok) setAnnouncements(await res.json()); } catch {} };
  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    void load();
  };

  if (!user || user.level !== 1) return <p className="text-muted-foreground">Unauthorized</p>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Broadcast / Comms"
        title="ANNOUNCEMENT"
        highlight="BOARD"
        sub="Post platform-wide messages and pin priority notices for all operators."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Announcement
          </Button>
        }
      />

      <div className="grid gap-3">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="empty-state">
              <div className="empty-icon-ring"><Megaphone size={26} /></div>
              <div className="empty-title">No Announcements</div>
              <div className="empty-sub">Post your first broadcast to notify all operators.</div>
            </CardContent>
          </Card>
        ) : announcements.map(a => (
          <Card key={a._id} className="fade-up">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5 text-sm min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Megaphone className="h-4 w-4 shrink-0" style={{ color: a.isActive ? 'var(--teal-2)' : 'var(--text-lo)' }} />
                    <span className="font-display font-bold tracking-wide" style={{ color: 'var(--text-hi)' }}>{a.title}</span>
                    {!a.isActive && <StatusBadge status="neutral">Hidden</StatusBadge>}
                    {a.priority > 0 && (
                      <span
                        className="inline-flex items-center gap-1 font-mono font-semibold"
                        style={{
                          background: 'rgba(240, 192, 64, 0.1)',
                          color: 'var(--gold)',
                          border: '1px solid rgba(240, 192, 64, 0.3)',
                          fontSize: '0.6rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '50px',
                        }}
                      >
                        <Pin className="h-2.5 w-2.5" /> P{a.priority}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap" style={{ color: 'var(--text-mid)' }}>{a.content}</p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                      <User className="h-3 w-3" /> {a.createdBy}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                      <Calendar className="h-3 w-3" /> {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--teal-3)' }} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => void remove(a._id)} title="Delete">
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Megaphone className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Title *
              </Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="// e.g. Scheduled maintenance window" className="mt-1.5" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                Content *
              </Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your announcement…" rows={4} className="mt-1.5" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label className="flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--text-mid)' }}>
                  {form.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} Active
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--text-mid)' }}>
                  <Hash className="h-3 w-3" style={{ color: 'var(--gold)' }} /> Priority
                </Label>
                <Input type="number" className="w-20" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
