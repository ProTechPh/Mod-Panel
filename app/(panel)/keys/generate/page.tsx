'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Copy, Check } from 'lucide-react';

const DURATIONS = [
  { value: '1h', label: '1 Hour' }, { value: '3h', label: '3 Hours' },
  { value: '1', label: '1 Day' }, { value: '3', label: '3 Days' }, { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' }, { value: '30', label: '30 Days' }, { value: '60', label: '60 Days' }, { value: '90', label: '90 Days' },
];
interface GameOption { gameCode: string; gameName: string; registrator: string; }
interface KeyGenForm { game: string; duration: string; maxDevices: number; count: number; }

export default function KeyGeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<KeyGenForm>({ defaultValues: { game: '', duration: '1', maxDevices: 1, count: 1 } });
  const duration = watch('duration'); const gameValue = watch('game');

  useEffect(() => {
    fetch('/api/game-settings?mine=true').then(res => res.json()).then(data => setGames(Array.isArray(data) ? data : [])).catch(() => setGames([]));
  }, []);

  const onSubmit = async (data: KeyGenForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.ok) { setGeneratedKeys(result.keys); toast.success(`Generated ${result.keys.length} key(s)`); } else toast.error(result.error || 'Failed to generate keys');
    } catch { toast.error('Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Generate Keys</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>

      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader><CardTitle>Key Configuration</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Game</Label>
                <Select value={gameValue} onValueChange={v => setValue('game', v ?? '')}>
                  <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder="Select game" /></SelectTrigger>
                  <SelectContent>{games.map(g => <SelectItem key={`${g.gameCode}-${g.registrator}`} value={g.gameCode}>{g.gameName} ({g.gameCode})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={v => setValue('duration', v ?? '1')}>
                  <SelectTrigger className="bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Max Devices</Label><Input type="number" min={1} max={10} {...register('maxDevices', { valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 10, message: 'Max 10' } })} className="bg-background/60 border-border/50" /></div>
                <div className="space-y-2"><Label>Count</Label><Input type="number" min={1} max={100} {...register('count', { valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 100, message: 'Max 100' } })} className="bg-background/60 border-border/50" /></div>
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/25" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Keys'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {generatedKeys.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
            <CardHeader><CardTitle>Generated Keys</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 font-mono text-sm bg-muted/50 border border-border/20 p-3 rounded-md max-h-48 overflow-y-auto">
                {generatedKeys.map((key, i) => <div key={i} className="py-0.5">{key}</div>)}
              </div>
              <Button variant="outline" className="mt-3 border-border/50" onClick={() => { navigator.clipboard.writeText(generatedKeys.join('\n')); toast.success('Keys copied to clipboard'); }}>
                <Copy className="h-4 w-4 mr-2" />Copy All
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
