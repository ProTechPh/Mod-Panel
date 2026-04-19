'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/shared/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Key {
  _id: string;
  game: string;
  userKey: string;
  duration: number | string;
  maxDevices: number;
  devices: string[];
  status: number;
  registrator: string;
  expiredDate: string | null;
  createdAt: string;
}

export default function KeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Key[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchKeys = async (searchVal = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ draw: '1', start: '0', length: '50', 'search[value]': searchVal });
      const res = await fetch(`/api/keys?${params}`);
      const data = await res.json();
      setKeys(data.data || []);
    } catch {
      toast.error('Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  // Owner (level 1) sees all keys, Admin (level 2) sees only their own
  if (user?.level !== 1 && user?.level !== 2) return <p className="text-muted-foreground">Access denied</p>;

  const handleSearch = () => fetchKeys(search);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this key?')) return;
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Key deleted');
      fetchKeys(search);
    } else {
      toast.error('Failed to delete key');
    }
  };

  const handleReset = async (id: string) => {
    const res = await fetch(`/api/keys/reset?id=${id}`);
    if (res.ok) {
      toast.success('Devices reset');
      fetchKeys(search);
    } else {
      toast.error('Failed to reset devices');
    }
  };

  const formatDuration = (d: number | string) => {
    if (d === '1h') return '1 Hour';
    if (d === '6h') return '6 Hours';
    return `${d} Day${Number(d) > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Keys</h2>
        <Link href="/keys/generate">
          <Button><Plus className="h-4 w-4 mr-2" />Generate</Button>
        </Link>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Search keys..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registrator</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : keys.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No keys found</TableCell></TableRow>
              ) : keys.map(key => (
                <TableRow key={key._id}>
                  <TableCell className="font-mono">{key.game}</TableCell>
                  <TableCell className="font-mono text-xs">{key.userKey}</TableCell>
                  <TableCell>{formatDuration(key.duration)}</TableCell>
                  <TableCell>{key.devices?.length ?? 0}/{key.maxDevices}</TableCell>
                  <TableCell>
                    <Badge variant={key.status === 1 ? 'default' : 'destructive'}>
                      {key.status === 1 ? 'Active' : 'Blocked'}
                    </Badge>
                  </TableCell>
                  <TableCell>{key.registrator}</TableCell>
                  <TableCell className="text-xs">{key.expiredDate ? new Date(key.expiredDate).toLocaleDateString() : 'Not used'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Link href={`/keys/${key._id}`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleReset(key._id)} title="Reset devices">
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(key._id)} title="Delete key">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}