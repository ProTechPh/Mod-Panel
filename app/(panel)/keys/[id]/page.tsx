'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/keys/${id}`)
      .then((res) => res.json())
      .then((data) => setKeyData(data))
      .catch(() => toast.error('Failed to load key'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!keyData) return;
    setSaving(true);
    const res = await fetch(`/api/keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: keyData.game, maxDevices: keyData.maxDevices, status: keyData.status }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Key updated');
      router.replace('/keys');
    } else toast.error('Failed to update key');
  };

  if (loading || !keyData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading-spinner" aria-label="Loading key" />
      </div>
    );
  }

  const devices = keyData.devices ?? [];

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        eyebrow="[ KEY RECORD ]"
        title="Edit"
        highlight="Key"
        sub="Adjust the game binding, device ceiling, or status of this license."
        actions={
          <StatusBadge status={keyData.status === 1 ? 'active' : 'blocked'} withDot>
            {keyData.status === 1 ? 'Active' : 'Blocked'}
          </StatusBadge>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-2">
          <div className="field">
            <Label className="field-label" htmlFor="key-code">
              Key
            </Label>
            <Input id="key-code" value={keyData.userKey} readOnly className="font-mono text-[0.8rem]" />
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="key-game">
              Game
            </Label>
            <Input
              id="key-game"
              value={keyData.game}
              onChange={(e) => setKeyData({ ...keyData, game: e.target.value })}
            />
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="key-duration">
              Duration
            </Label>
            <Input
              id="key-duration"
              value={String(keyData.duration)}
              readOnly
              className="text-muted-foreground"
            />
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="key-devices">
              Max devices
            </Label>
            <Input
              id="key-devices"
              type="number"
              min={1}
              max={10}
              value={keyData.maxDevices}
              onChange={(e) => setKeyData({ ...keyData, maxDevices: Number(e.target.value) })}
            />
          </div>

          <div className="field">
            <Label className="field-label">Status</Label>
            <Select
              value={String(keyData.status)}
              onValueChange={(v) => setKeyData({ ...keyData, status: Number(v) as 0 | 1 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="field">
            <Label className="field-label">Bound devices ({devices.length})</Label>
            <div className="surface-inset max-h-32 overflow-y-auto rounded-lg p-3 font-mono text-[0.7rem] leading-relaxed">
              {devices.length > 0 ? (
                devices.map((d, i) => <div key={`${d}-${i}`}>{d}</div>)
              ) : (
                <span className="text-muted-foreground">No devices bound</span>
              )}
            </div>
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="key-registrator">
              Registrator
            </Label>
            <Input
              id="key-registrator"
              value={keyData.registrator}
              readOnly
              className="text-muted-foreground"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving && <Loader2 aria-hidden className="animate-spin" />}
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
