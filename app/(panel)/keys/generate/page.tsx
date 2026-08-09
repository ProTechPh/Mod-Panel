'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { KeyRound, Copy, Check, Cpu, Clock, Hash, MonitorSmartphone, Gamepad2, Layers, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

const DURATIONS = [
  { value: '1h', label: '1 Hour' }, { value: '3h', label: '3 Hours' },
  { value: '1', label: '1 Day' }, { value: '3', label: '3 Days' }, { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' }, { value: '30', label: '30 Days' }, { value: '60', label: '60 Days' }, { value: '90', label: '90 Days' },
  { value: 'lifetime', label: 'Lifetime' },
];

interface GameOption { gameCode: string; gameName: string; registrator: string; }

interface KeyGenForm {
  game: string;
  duration: string;
  maxDevices: number;
  count: number;
}

interface BatchProgress {
  currentGame: string;
  gameIndex: number;
  totalGames: number;
  keysPerGame: number;
  status: 'generating' | 'complete' | 'error';
}

export default function KeyGeneratePage() {
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [copied, setCopied] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [keysPerGame, setKeysPerGame] = useState(1);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [batchResults, setBatchResults] = useState<{ game: string; count: number; error?: string }[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<KeyGenForm>({
    defaultValues: { game: '', duration: '1', maxDevices: 1, count: 1 }
  });
  // React Compiler can't memoize RHF's `watch()` without risking stale UI; acceptable for this small form
  // eslint-disable-next-line react-hooks/incompatible-library
  const duration = watch('duration');
  // eslint-disable-next-line react-hooks/incompatible-library
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

  const toggleGame = useCallback((code: string) => {
    setSelectedGames(prev =>
      prev.includes(code) ? prev.filter(g => g !== code) : [...prev, code]
    );
  }, []);

  const totalBatchKeys = selectedGames.length * keysPerGame;

  const onSubmit = async (data: KeyGenForm) => {
    setLoading(true);
    setBatchResults([]);

    if (batchMode) {
      const results: { game: string; count: number; error?: string }[] = [];
      const totalGames = selectedGames.length;

      for (let i = 0; i < totalGames; i++) {
        const gameCode = selectedGames[i];
        const gameOption = games.find(g => g.gameCode === gameCode);
        setBatchProgress({
          currentGame: gameOption?.gameName || gameCode,
          gameIndex: i + 1,
          totalGames,
          keysPerGame,
          status: 'generating',
        });

        try {
          const res = await fetch('/api/keys/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, game: gameCode, count: keysPerGame }),
          });
          const result = await res.json();
          if (res.ok) {
            results.push({ game: gameCode, count: result.keys.length });
            setGeneratedKeys(prev => [...prev, ...result.keys]);
          } else {
            results.push({ game: gameCode, count: 0, error: result.error });
          }
        } catch {
          results.push({ game: gameCode, count: 0, error: 'Network error' });
        }
      }

      setBatchResults(results);
      setBatchProgress(prev => prev ? { ...prev, status: 'complete' } : null);

      const totalGenerated = results.reduce((sum, r) => sum + r.count, 0);
      const failedGames = results.filter(r => r.error);
      if (failedGames.length > 0) {
        toast.warning(`Generated ${totalGenerated} keys. ${failedGames.length} game(s) failed.`);
      } else {
        toast.success(`Generated ${totalGenerated} keys across ${totalGames} games`);
      }
    } else {
      try {
        const res = await fetch('/api/keys/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (res.ok) { setGeneratedKeys(result.keys); toast.success(`Generated ${result.keys.length} key(s)`); }
        else toast.error(result.error || 'Failed to generate keys');
      } catch { toast.error('Network error'); }
    }

    setLoading(false);
    setBatchProgress(null);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        eyebrow="Licence Forge"
        title="GENERATE"
        highlight="KEYS"
        sub="Issue fresh licence keys with custom duration, device caps, and batch size."
      />

      <div className="panel fade-up d1">
        <div className="panel-head">
          <h2 className="panel-title flex items-center gap-2">
            <Cpu className="h-4 w-4 text-orange-500 animate-pulse" />
            Licence Forge Parameters
          </h2>
          <span className="panel-badge">FORGE</span>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Batch Mode Toggle */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: batchMode ? '1px solid var(--teal-2)' : '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" style={{ color: batchMode ? 'var(--teal-2)' : 'var(--text-mid)' }} />
                <Label className="text-sm font-mono uppercase tracking-wider" style={{ color: batchMode ? 'var(--teal-2)' : 'var(--text-mid)' }}>
                  Batch Mode
                </Label>
              </div>
              <Switch
                checked={batchMode}
                onCheckedChange={(checked) => {
                  setBatchMode(checked);
                  if (!checked) {
                    setSelectedGames([]);
                    setBatchResults([]);
                    setBatchProgress(null);
                  }
                }}
                style={{
                  backgroundColor: batchMode ? 'var(--teal-2)' : undefined,
                }}
              />
            </div>

            {/* Batch Mode: Multi-Select Games */}
            {batchMode ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                  <Gamepad2 className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Select Games ({selectedGames.length} selected)
                </Label>
                <div
                  className="grid grid-cols-1 gap-2 p-3 rounded-lg max-h-48 overflow-y-auto"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {games.map(g => (
                    <label
                      key={`${g.gameCode}-${g.registrator}`}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer transition-all hover:bg-white/5"
                      style={{
                        border: selectedGames.includes(g.gameCode) ? '1px solid var(--teal-2)' : '1px solid transparent',
                        background: selectedGames.includes(g.gameCode) ? 'rgba(0, 255, 128, 0.05)' : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGames.includes(g.gameCode)}
                        onChange={() => toggleGame(g.gameCode)}
                        className="w-4 h-4 accent-[var(--teal-2)]"
                      />
                      <span className="text-sm" style={{ color: 'var(--text-lo)' }}>{g.gameName}</span>
                      <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-lo)' }}>({g.gameCode})</span>
                    </label>
                  ))}
                  {games.length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-lo)' }}>No games available</p>
                  )}
                </div>
                {selectedGames.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--red)' }}>Select at least one game</p>
                )}
              </div>
            ) : (
              /* Single Mode: Game Select */
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
            )}

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
              {batchMode ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                    <Hash className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Keys per Game
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={keysPerGame}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 10) setKeysPerGame(val);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                    <Hash className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Count
                  </Label>
                  <Input type="number" min={1} max={100} {...register('count', { valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 100, message: 'Max 100' } })} />
                  {errors.count && <p className="text-xs" style={{ color: 'var(--red)' }}>{errors.count.message}</p>}
                </div>
              )}
            </div>

            {/* Batch Summary */}
            {batchMode && selectedGames.length > 0 && (
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: 'rgba(0, 255, 128, 0.05)',
                  border: '1px solid rgba(0, 255, 128, 0.2)',
                }}
              >
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-mid)' }}>
                  Total Keys
                </span>
                <span className="text-sm font-mono font-bold" style={{ color: 'var(--teal-2)' }}>
                  {totalBatchKeys} keys ({selectedGames.length} games × {keysPerGame} per game)
                </span>
              </div>
            )}

            {/* Batch Progress */}
            {batchProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span style={{ color: 'var(--text-mid)' }}>
                    Generating keys for <span style={{ color: 'var(--teal-2)' }}>{batchProgress.currentGame}</span>...
                  </span>
                  <span style={{ color: 'var(--teal-2)' }}>
                    {batchProgress.gameIndex}/{batchProgress.totalGames}
                  </span>
                </div>
                <Progress
                  value={batchProgress.gameIndex}
                  max={batchProgress.totalGames}
                  className="h-1.5"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || (batchMode && selectedGames.length === 0)}
              className="w-full h-11"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              )}
              {loading ? 'Generating…' : batchMode ? `Generate ${totalBatchKeys} Keys` : 'Generate Keys'}
            </Button>
          </form>
        </div>
      </div>

      {/* Batch Results Summary */}
      {batchResults.length > 0 && (
        <div className="panel fade-up d1" style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}>
          <div className="panel-head">
            <h2 className="panel-title flex items-center gap-2">
              <Layers className="h-4 w-4" style={{ color: 'var(--ecto-green)' }} />
              Batch Results
            </h2>
            <span className="panel-badge">BATCH</span>
          </div>
          <div className="p-5">
            <div className="space-y-1.5 font-mono text-sm">
              {batchResults.map((result, i) => {
                const gameOption = games.find(g => g.gameCode === result.game);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: result.error ? '1px solid var(--red)' : '1px solid rgba(57, 255, 20, 0.2)',
                    }}
                  >
                    <span style={{ color: 'var(--text-lo)' }}>
                      {gameOption?.gameName || result.game}
                    </span>
                    <span style={{ color: result.error ? 'var(--red)' : 'var(--ecto-green)' }}>
                      {result.error ? result.error : `${result.count} keys`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
      </div>
      )}

      {generatedKeys.length > 0 && (
        <div className="panel fade-up d2" style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}>
          <div className="panel-head">
            <h2 className="panel-title flex items-center gap-2">
              <Check className="h-4 w-4" style={{ color: 'var(--ecto-green)' }} />
              Generated Keys
            </h2>
            <span className="panel-badge">{generatedKeys.length} KEYS</span>
          </div>
          <div className="p-5">
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
          </div>
      </div>
      )}
    </div>
  );
}
