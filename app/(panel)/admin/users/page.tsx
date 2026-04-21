'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/shared/AuthProvider';
import { Search, Trash2, Edit, Users, Gift } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReferralsTable from '@/components/shared/ReferralsTable';

interface User {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  level: number;
  saldo: number;
  status: number;
  expirationDate: string;
  telegramId: number | null;
  telegramUsername: string;
}

interface Referral {
  _id: string;
  code: string;
  level: number;
  setSaldo: number;
  usedBy: string;
  createdBy: string;
  accExpiration: string;
}

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
    if (res.ok) { toast.success('User deleted'); fetchUsers(search); }
    else toast.error('Failed to delete');
  };

  const statusLabel = (s: number) => s === 1 ? 'Active' : s === 2 ? 'Banned' : 'Expired';
  const levelLabel = (l: number) => l === 1 ? 'Owner' : l === 2 ? 'Admin' : 'Reseller';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users & Referrals</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('users')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Users className="h-4 w-4" /> Users
          </button>
          <button
            onClick={() => setTab('referrals')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === 'referrals' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Gift className="h-4 w-4" /> Referrals
          </button>
        </div>
      </div>

      {tab === 'users' ? (
        <>
          <div className="flex gap-2">
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers(search)} className="max-w-sm" />
            <Button variant="outline" onClick={() => fetchUsers(search)}><Search className="h-4 w-4" /></Button>
          </div>
          <Card className="border-border/50">
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
                      <TableCell>
                        {u.telegramId ? (
                          <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">
                            @ {u.telegramUsername || u.telegramId}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">Not linked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{u.expirationDate ? new Date(u.expirationDate).toLocaleDateString() : ''}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link href={`/admin/users/${u._id}`}>
                            <Button variant="ghost" size="sm"><Edit className="h-3 w-3" /></Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u._id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <ReferralsTable referrals={referrals} onRefresh={fetchReferrals} />
      )}
    </div>
  );
}