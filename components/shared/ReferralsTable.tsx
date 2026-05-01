'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Referral {
  _id: string;
  code: string;
  level: number;
  setSaldo: number;
  usedBy: string;
  createdBy: string;
  accExpiration: string;
}

export default function ReferralsTable({ referrals, onRefresh }: { referrals: Referral[]; onRefresh: () => void }) {
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ level: '3', setSaldo: '0', accExpirationDays: '30' });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: Number(form.level),
          setSaldo: Number(form.setSaldo),
          accExpirationDays: Number(form.accExpirationDays),
        }),
      });
      if (res.ok) {
        toast.success('Referral created');
        setDialogOpen(false);
        onRefresh();
      } else {
        toast.error('Failed to create referral');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this referral?')) return;
    const res = await fetch(`/api/referrals/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); onRefresh(); }
    else toast.error('Failed to delete');
  };

  const levelLabel = (l: number) => l === 1 ? 'Owner' : l === 2 ? 'Admin' : 'Reseller';

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Create Referral</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Create Referral Code</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setForm({ ...form, level: v ?? '3' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Owner</SelectItem>
                    <SelectItem value="2">Admin</SelectItem>
                    <SelectItem value="3">Reseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Set Saldo</Label>
                <Input type="number" value={form.setSaldo} onChange={e => setForm({ ...form, setSaldo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Account Duration (days)</Label>
                <Input type="number" value={form.accExpirationDays} onChange={e => setForm({ ...form, accExpirationDays: e.target.value })} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No referrals</TableCell></TableRow>
              ) : referrals.map(r => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono font-bold">{r.code}</TableCell>
                  <TableCell><Badge variant="outline">{levelLabel(r.level)}</Badge></TableCell>
                  <TableCell className="font-mono">${r.setSaldo}</TableCell>
                  <TableCell>{r.usedBy || <span className="text-muted-foreground">Unused</span>}</TableCell>
                  <TableCell>{r.createdBy}</TableCell>
                  <TableCell className="text-xs">{r.accExpiration ? new Date(r.accExpiration).toLocaleDateString() : ''}</TableCell>
                  <TableCell className="text-right">
                    {!r.usedBy && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r._id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}