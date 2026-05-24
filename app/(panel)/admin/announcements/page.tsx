'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Megaphone, Pencil } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isActive: true, priority: 0 });

  const load = async () => {
    const res = await fetch('/api/admin/announcements');
    if (res.ok) setAnnouncements(await res.json());
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', content: '', isActive: true, priority: 0 });
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, isActive: a.isActive, priority: a.priority });
    setDialogOpen(true);
  };

  const save = async () => {
    const body: any = { ...form };
    if (editing) body._id = editing._id;

    const res = await fetch('/api/admin/announcements', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editing ? 'Updated' : 'Created');
      setDialogOpen(false);
      load();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    load();
  };

  if (!user || user.level !== 1) return <p className="text-muted-foreground">Unauthorized</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Announcement</Button>
      </div>

      <div className="grid gap-3">
        {announcements.map(a => (
          <Card key={a._id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{a.title}</span>
                    {!a.isActive && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                    {a.priority > 0 && <Badge className="text-xs">Priority {a.priority}</Badge>}
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-muted-foreground">by {a.createdBy} &middot; {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a._id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No announcements yet.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your announcement..." rows={4} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label>Priority</Label>
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
