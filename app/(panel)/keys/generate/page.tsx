'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { KeyRound, Copy, Check, Cpu, Clock, Hash, MonitorSmartphone, Gamepad2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

const DURATIONS = [
  { value: '1h', label: '1 Hour' }, { value: '3h', label: '3 Hours' },
  { value: '1', label: '1 Day' }, { value: '3', label: '3 Days' }, { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' }, { value: '30', label: '30 Days' }, { value: '60', label: '60 Days' }, { value: '90', label: '90 Days' },
];
interface GameOption { gameCode: string; gameName: string; registrator: string; }
interface KeyGenForm { game: string; duration: string; maxDevices: number; count: number; }

export default function KeyGeneratePage() {
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<KeyGenForm>({ defaultValues: { game: '', duration: '1', maxDevices: 1, count: 1 } });
  const duration = watch('duration');
  const gameValue = watch('game');

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/game-settings?mine=true');
        const data = await res.json();
        setGames(Array.isArray(data) ? data : []);
      } catch {
        setGames([]);
      }
    })();
  }, []);

  const onSubmit = async (data: KeyGenForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) { setGeneratedKeys(result.keys); toast.success(`Generated ${result.keys.length} key(s)`); }
      else toast.error(result.error || 'Failed to generate keys');
    } catch { toast.error('Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        eyebrow="Licence Forge"
        title="GENERATE"
        highlight="KEYS"
        sub="Issue fresh licence keys with custom duration, device caps, and batch size."
      />

      <Card className="fade-up d1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
            Key Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Gamepad2 className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Game
              </Label>
              <Select value={gameValue} onValueChange={v => setValue('game', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="// select game…" /></SelectTrigger>
                <SelectContent>
                  {games.map(g => (
                    <SelectItem key={`${g.gameCode}-${g.registrator}`} value={g.gameCode}>
                      {g.gameName} <span style={{ color: 'var(--text-lo)' }}>({g.gameCode})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Clock className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Duration
              </Label>
              <Select value={duration} onValueChange={v => setValue('duration', v ?? '1')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                  <MonitorSmartphone className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Max Devices
                </Label>
                <Input type="number" min={1} max={10} {...register('maxDevices', { valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 10, message: 'Max 10' } })} />
                {errors.maxDevices && <p className="text-xs" style={{ color: 'var(--red)' }}>{errors.maxDevices.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                  <Hash className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Count
                </Label>
                <Input type="number" min={1} max={100} {...register('count', { valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 100, message: 'Max 100' } })} />
                {errors.count && <p className="text-xs" style={{ color: 'var(--red)' }}>{errors.count.message}</p>}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11">
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              {loading ? 'Generating…' : 'Generate Keys'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedKeys.length > 0 && (
        <Card className="fade-up d2" style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-4 w-4" style={{ color: 'var(--ecto-green)' }} />
              Generated Keys
              <span
                className="ml-auto font-mono text-xs"
                style={{
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                  color: '#86efac',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '50px',
                  letterSpacing: '0.1em',
                }}
              >
                {generatedKeys.length} KEYS
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-1 font-mono text-sm p-4 rounded-lg max-h-64 overflow-y-auto"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border)',
                color: 'var(--ecto-green)',
              }}
            >
              {generatedKeys.map((key, i) => (
                <div key={i} className="py-0.5 flex items-center gap-2">
                  <span style={{ color: 'var(--text-lo)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{key}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(generatedKeys.join('\n'));
                  setCopied(true);
                  toast.success('Keys copied to clipboard');
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
