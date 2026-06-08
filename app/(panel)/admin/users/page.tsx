'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/shared/AuthProvider';
import { Search, Trash2, Edit, Users, Gift, Mail, AtSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import ReferralsTable from '@/components/shared/ReferralsTable';

interface User {
  _id: string; username: string; email: string; fullname: string;
  level: number; saldo: number; status: number; expirationDate: string;
  telegramId: number | null; telegramUsername: string;
}
interface Referral { _id: string; code: string; level: number; setSaldo: number; usedBy: string; createdBy: string; accExpiration: string; }
type Tab = 'users' | 'referrals';

export default function UsersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [page, setPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const PAGE_SIZE = 50;

  const fetchUsers = async (searchVal: string, pageVal = 1) => {
    const params = new URLSearchParams({ draw: '1', start: String((pageVal - 1) * PAGE_SIZE), length: String(PAGE_SIZE), 'search[value]': searchVal });
    const res = await fetch(`/api/users?${params}`);
    const data = await res.json();
    setUsers(data.data || []);
    setTotalFiltered(data.recordsFiltered ?? 0);
  };
  const fetchReferrals = async () => {
    const res = await fetch('/api/referrals');
    const data = await res.json();
    setReferrals(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void fetchUsers('');
    void (async () => {
      try {
        const res = await fetch('/api/referrals');
        const data = await res.json();
        setReferrals(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User deleted'); void fetchUsers(search, page); } else toast.error('Failed to delete');
  };
  const statusLabel = (s: number) => s === 1 ? 'Active' : s === 2 ? 'Banned' : 'Expired';
  const statusKind = (s: number): 'active' | 'blocked' | 'warning' => s === 1 ? 'active' : s === 2 ? 'blocked' : 'warning';
  const levelLabel = (l: number) => l === 1 ? 'Owner' : l === 2 ? 'Admin' : l === 3 ? 'Reseller' : 'Buyer';
  const levelKind = (l: number): 'success' | 'info' | 'warning' | 'neutral' => l === 1 ? 'success' : l === 2 ? 'info' : l === 3 ? 'warning' : 'neutral';

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="User Management"
        title="USERS"
        highlight="REFERRALS"
        sub="Manage operator accounts, levels, balances, and invite codes."
        actions={
          <div
            className="flex rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => setTab('users')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: tab === 'users' ? 'rgba(20, 184, 184, 0.12)' : 'transparent',
                color: tab === 'users' ? 'var(--teal-3)' : 'var(--text-mid)',
                borderRight: '1px solid var(--border)',
                boxShadow: tab === 'users' ? 'inset 0 0 0 1px rgba(20, 184, 184, 0.35)' : 'none',
              }}
            >
              <Users className="h-3.5 w-3.5" /> Users
            </button>
            <button
              onClick={() => setTab('referrals')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: tab === 'referrals' ? 'rgba(20, 184, 184, 0.12)' : 'transparent',
                color: tab === 'referrals' ? 'var(--teal-3)' : 'var(--text-mid)',
                boxShadow: tab === 'referrals' ? 'inset 0 0 0 1px rgba(20, 184, 184, 0.35)' : 'none',
              }}
            >
              <Gift className="h-3.5 w-3.5" /> Referrals
            </button>
          </div>
        }
      />

      {tab === 'users' ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-lo)] pointer-events-none" />
              <Input
                placeholder="// search by username, email, fullname…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (setPage(1), void fetchUsers(search, 1))}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={() => { setPage(1); void fetchUsers(search, 1); }}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Card className="fade-up d1 overflow-hidden">
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
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Users className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        <div className="font-mono text-xs uppercase tracking-widest">No users in registry</div>
                      </TableCell>
                    </TableRow>
                  ) : users.map(u => (
                    <TableRow key={u._id}>
                      <TableCell className="font-mono" style={{ color: 'var(--text-hi)' }}>{u.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
                          <Mail className="h-3 w-3" style={{ color: 'var(--text-lo)' }} />
                          {u.email}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={levelKind(u.level)}>{levelLabel(u.level)}</StatusBadge></TableCell>
                      <TableCell className="font-mono" style={{ color: 'var(--ecto-green)' }}>${u.saldo?.toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={statusKind(u.status)} withDot>{statusLabel(u.status)}</StatusBadge></TableCell>
                      <TableCell>
                        {u.telegramId
                          ? <span className="inline-flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--teal-3)' }}>
                              <AtSign className="h-3 w-3" /> {u.telegramUsername || u.telegramId}
                            </span>
                          : <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>Not linked</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
                          {u.expirationDate && <Calendar className="h-3 w-3" style={{ color: 'var(--text-lo)' }} />}
                          {u.expirationDate ? new Date(u.expirationDate).toLocaleDateString() : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link href={`/admin/users/${u._id}`}>
                            <Button variant="ghost" size="icon-sm" title="Edit user">
                              <Edit className="h-3.5 w-3.5" style={{ color: 'var(--teal-3)' }} />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon-sm" onClick={() => void handleDeleteUser(u._id)} title="Delete user">
                            <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalFiltered > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={page <= 1}
                      onClick={() => { setPage(p => p - 1); void fetchUsers(search, page - 1); }}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" style={{ color: page <= 1 ? 'var(--text-lo)' : 'var(--teal-2)' }} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={page * PAGE_SIZE >= totalFiltered}
                      onClick={() => { setPage(p => p + 1); void fetchUsers(search, page + 1); }}
                    >
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: page * PAGE_SIZE >= totalFiltered ? 'var(--text-lo)' : 'var(--teal-2)' }} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <ReferralsTable referrals={referrals} onRefresh={() => void fetchReferrals()} />
      )}
    </div>
  );
}
