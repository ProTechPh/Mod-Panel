'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface UserData { _id: string; username: string; email: string; fullname: string; level: number; saldo: number; status: number; expirationDate: string; }

export default function EditUserPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(`/api/users/${id}`).then(res => res.json()).then(data => setUserData(data)).catch(() => toast.error('Failed to load user')).finally(() => setLoading(false)); }, [id]);

  if (authUser?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;
  if (loading || !userData) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  const handleSave = async () => {
    const res = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullname: userData.fullname, email: userData.email, level: userData.level, saldo: userData.saldo, status: userData.status, expirationDate: userData.expirationDate }) });
    if (res.ok) { toast.success('User updated'); router.replace('/admin/users'); } else toast.error('Failed to update user');
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Edit User: {userData.username}</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2"><Label>Full Name</Label><Input value={userData.fullname} onChange={e => setUserData({ ...userData, fullname: e.target.value })} className="bg-background/60 border-border/50" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} className="bg-background/60 border-border/50" /></div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={String(userData.level)} onValueChange={v => setUserData({ ...userData, level: Number(v) as 1 | 2 | 3 })}>
                <SelectTrigger className="bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Owner</SelectItem><SelectItem value="2">Admin</SelectItem><SelectItem value="3">Reseller</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Saldo</Label><Input type="number" step="0.01" value={userData.saldo} onChange={e => setUserData({ ...userData, saldo: Number(e.target.value) })} className="bg-background/60 border-border/50" /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={String(userData.status)} onValueChange={v => setUserData({ ...userData, status: Number(v) as 1 | 2 | 3 })}>
                <SelectTrigger className="bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="2">Banned</SelectItem><SelectItem value="3">Expired</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Expiration Date</Label><Input type="datetime-local" value={userData.expirationDate ? new Date(userData.expirationDate).toISOString().slice(0, 16) : ''} onChange={e => setUserData({ ...userData, expirationDate: e.target.value })} className="bg-background/60 border-border/50" /></div>
            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
