'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface KeyData { _id: string; game: string; userKey: string; duration: number | string; maxDevices: number; devices: string[]; status: number; registrator: string; expiredDate: string | null; }

export default function EditKeyPage() {
  const router = useRouter(); const params = useParams(); const id = params.id as string;
  const [keyData, setKeyData] = useState<KeyData | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`/api/keys/${id}`).then(res => res.json()).then(data => setKeyData(data)).catch(() => toast.error('Failed to load key')).finally(() => setLoading(false)); }, [id]);

  if (loading || !keyData) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  const handleSave = async () => {
    const res = await fetch(`/api/keys/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game: keyData.game, maxDevices: keyData.maxDevices, status: keyData.status }) });
    if (res.ok) { toast.success('Key updated'); router.replace('/keys'); } else toast.error('Failed to update key');
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Edit Key</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2"><Label>Key</Label><Input value={keyData.userKey} readOnly className="font-mono bg-muted/50" /></div>
            <div className="space-y-2"><Label>Game</Label><Input value={keyData.game} onChange={e => setKeyData({ ...keyData, game: e.target.value })} className="bg-background/60 border-border/50" /></div>
            <div className="space-y-2"><Label>Duration</Label><Input value={String(keyData.duration)} readOnly className="text-muted-foreground bg-muted/50" /></div>
            <div className="space-y-2"><Label>Max Devices</Label><Input type="number" min={1} max={10} value={keyData.maxDevices} onChange={e => setKeyData({ ...keyData, maxDevices: Number(e.target.value) })} className="bg-background/60 border-border/50" /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={String(keyData.status)} onValueChange={v => setKeyData({ ...keyData, status: Number(v) as 0 | 1 })}>
                <SelectTrigger className="bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="0">Blocked</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Devices ({keyData.devices?.length ?? 0})</Label>
              <div className="bg-muted/50 border border-border/20 rounded-md p-3 text-xs font-mono max-h-32 overflow-y-auto">
                {keyData.devices?.length > 0 ? keyData.devices.map((d, i) => <div key={i}>{d}</div>) : <span className="text-muted-foreground">No devices bound</span>}
              </div>
            </div>
            <div className="space-y-2"><Label>Registrator</Label><Input value={keyData.registrator} readOnly className="text-muted-foreground bg-muted/50" /></div>
            <Button onClick={handleSave} className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/25">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
