'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface KeyData {
  _id: string;
  game: string;
  userKey: string;
  duration: number | string;
  maxDevices: number;
  devices: string[];
  status: number;
  registrator: string;
  expiredDate: string | null;
}

export default function EditKeyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [keyData, setKeyData] = useState<KeyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/keys/${id}`)
      .then(res => res.json())
      .then(data => setKeyData(data))
      .catch(() => toast.error('Failed to load key'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !keyData) return <p>Loading...</p>;

  const handleSave = async () => {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: keyData.game,
        maxDevices: keyData.maxDevices,
        status: keyData.status,
      }),
    });
    if (res.ok) {
      toast.success('Key updated');
      router.push('/keys');
    } else {
      toast.error('Failed to update key');
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-2xl font-bold tracking-tight">Edit Key</h2>
      <Card className="border-border/50">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Key</Label>
            <Input value={keyData.userKey} readOnly className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Game</Label>
            <Input value={keyData.game} onChange={e => setKeyData({ ...keyData, game: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input value={String(keyData.duration)} readOnly className="text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Max Devices</Label>
            <Input type="number" min={1} max={10} value={keyData.maxDevices} onChange={e => setKeyData({ ...keyData, maxDevices: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={String(keyData.status)} onValueChange={v => setKeyData({ ...keyData, status: Number(v) as 0 | 1 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Devices ({keyData.devices?.length ?? 0})</Label>
            <div className="bg-muted rounded-md p-3 text-xs font-mono max-h-32 overflow-y-auto">
              {keyData.devices?.length > 0 ? keyData.devices.map((d, i) => <div key={i}>{d}</div>) : 'No devices bound'}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Registrator</Label>
            <Input value={keyData.registrator} readOnly className="text-muted-foreground" />
          </div>
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}