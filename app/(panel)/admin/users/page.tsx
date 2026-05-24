'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/shared/AuthProvider';
import { Search, Trash2, Edit, Users, Gift, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReferralsTable from '@/components/shared/ReferralsTable';

interface User { _id: string; username: string; email: string; fullname: string; level: number; saldo: number; status: number; expirationDate: string; telegramId: number | null; telegramUsername: string; }
interface Referral { _id: string; code: string; level: number; setSaldo: number; usedBy: string; createdBy: string; accExpiration: string; }
type Tab = 'users' | 'referrals';

export default function UsersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const fetchUsers = async (searchVal = '') => {
    const params = new URLSearchParams({ draw: '1', start: '0', length: '50', 'search[value]': searchVal });
    const res = await fetch(`/api/users?${params}`);
    const data = await res.json();
    setUsers(data.data || []);
  };
  const fetchReferrals = async () => {
    const res = await fetch('/api/referrals');
    const data = await res.json();
    setReferrals(Array.isArray(data) ? data : []);
  };
  useEffect(() => { fetchUsers(); fetchReferrals(); }, []);

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User deleted'); fetchUsers(search); } else toast.error('Failed to delete');
  };
  const statusLabel = (s: number) => s === 1 ? 'Active' : s === 2 ? 'Banned' : 'Expired';
  const levelLabel = (l: number) => l === 1 ? 'Owner' : l === 2 ? 'Admin' : 'Reseller';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Users & Referrals</h2>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('users')} className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors', tab === 'users' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
            <Users className="h-4 w-4" /> Users
          </button>
          <button onClick={() => setTab('referrals')} className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors', tab === 'referrals' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
            <Gift className="h-4 w-4" /> Referrals
          </button>
        </div>
      </div>

      {tab === 'users' ? (
        <>
          <div className="flex gap-2">
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers(search)} className="max-w-sm bg-background/60 border-border/50" />
            <Button variant="outline" onClick={() => fetchUsers(search)} className="border-border/50"><Search className="h-4 w-4" /></Button>
          </div>
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Telegram</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u._id}>
                        <TableCell>{u.username}</TableCell>
                        <TableCell className="text-xs">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{levelLabel(u.level)}</Badge></TableCell>
                        <TableCell className="font-mono">${u.saldo?.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={u.status === 1 ? 'default' : 'destructive'}>{statusLabel(u.status)}</Badge></TableCell>
                        <TableCell>{u.telegramId ? <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">@ {u.telegramUsername || u.telegramId}</Badge> : <Badge variant="secondary" className="text-muted-foreground">Not linked</Badge>}</TableCell>
                        <TableCell className="text-xs">{u.expirationDate ? new Date(u.expirationDate).toLocaleDateString() : ''}</TableCell>
                        <TableCell className="text-right"><div className="flex gap-1 justify-end">
                          <Link href={`/admin/users/${u._id}`}><Button variant="ghost" size="sm"><Edit className="h-3 w-3" /></Button></Link>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u._id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <ReferralsTable referrals={referrals} onRefresh={fetchReferrals} />
      )}
    </div>
  );
}
