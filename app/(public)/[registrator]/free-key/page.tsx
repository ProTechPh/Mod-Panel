'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/shared/ThemeProvider';
import {
  Moon, Sun, Copy, Check, RefreshCw, Loader2,
  Clock, Smartphone, ShieldAlert, KeyRound, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';

interface GameOption {
  code: string;
  name: string;
}

interface KeyStatus {
  key: string;
  game: string;
  status: number;
  isActivated: boolean;
  isExpired: boolean;
  expiredDate: string | null;
  deviceCount: number;
  resetsRemaining: number;
}

function formatCountdown(targetIso: string | null): string {
  if (!targetIso) return '—';
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const totalSecs = Math.floor(diff / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function FreeKeyPage() {
  const { registrator } = useParams<{ registrator: string }>();
  const { theme, toggleTheme } = useTheme();

  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Server-side key state (IP-based, no localStorage)
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true); // true on initial load
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Fetch existing key by IP from server
  const fetchMyKey = useCallback(async (silent = false) => {
    if (!silent) setStatusLoading(true);
    try {
      const res = await fetch(`/api/free-key/my-key?registrator=${encodeURIComponent(registrator)}`);
      const data = await res.json();
      setKeyStatus(res.ok ? data : null);
    } catch {
      setKeyStatus(null);
    } finally {
      setStatusLoading(false);
      setLookupLoading(false);
    }
  }, [registrator]);

  // On mount: check server for existing key
  useEffect(() => {
    fetchMyKey(true);
  }, [fetchMyKey]);

  // Fetch games list
  useEffect(() => {
    fetch(`/api/free-key/games?registrator=${encodeURIComponent(registrator)}`)
      .then(res => res.json())
      .then(data => setGames(Array.isArray(data) ? data : []))
      .catch(() => setGames([]));
  }, [registrator]);

  // Live countdown
  useEffect(() => {
    if (!keyStatus?.expiredDate) { setCountdown(''); return; }
    const tick = () => setCountdown(formatCountdown(keyStatus.expiredDate));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [keyStatus?.expiredDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { toast.error('Complete captcha verification'); return; }

    setGenerating(true);
    try {
      const res = await fetch('/api/free-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, turnstileToken, registrator }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Free key generated!');
        // Re-fetch from server to populate the key panel (IP-based)
        await fetchMyKey(true);
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setGenerating(false);
      setTurnstileToken('');
    }
  };

  const handleCopy = () => {
    if (!keyStatus?.key) return;
    navigator.clipboard.writeText(keyStatus.key);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetDevices = async () => {
    if (!keyStatus?.key) return;
    setResetLoading(true);
    try {
      const res = await fetch('/api/free-key/reset-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyStatus.key }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Devices reset! ${data.resetsRemaining} reset(s) remaining.`);
        await fetchMyKey(true);
      } else {
        toast.error(data.error || 'Failed to reset devices');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResetLoading(false);
    }
  };

  const statusColor = () => {
    if (!keyStatus) return 'text-muted-foreground';
    if (keyStatus.isExpired || keyStatus.status === 0) return 'text-destructive';
    if (keyStatus.isActivated) return 'text-green-500';
    return 'text-amber-500';
  };

  const statusLabel = () => {
    if (!keyStatus) return '—';
    if (keyStatus.status === 0) return 'Suspended';
    if (keyStatus.isExpired) return 'Expired';
    if (keyStatus.isActivated) return 'Active – 1h timer running';
    return 'Unused – grace period (1 day)';
  };

  const hasActiveKey = keyStatus && !keyStatus.isExpired && keyStatus.status === 1;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <KeyRound className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Free Key Generator</CardTitle>
          </div>
          <CardDescription>Generate a free 1-hour key from {registrator}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* ── Initial lookup spinner ─────────────────────────── */}
          {lookupLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* ── My Key Panel (shown when user has a key on this IP) ── */}
          {!lookupLoading && keyStatus && (
            <div className="space-y-3">
              {/* Key display */}
              <div className="rounded-lg border border-border/50 bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Free Key</span>
                  <span className="text-xs text-muted-foreground font-mono">{keyStatus.game}</span>
                </div>
                <p className="font-mono text-sm break-all select-all">{keyStatus.key}</p>
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs gap-1.5">
                  {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy Key</>}
                </Button>
              </div>

              {/* Status panel */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</span>
                  <button
                    onClick={() => fetchMyKey()}
                    disabled={statusLoading}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {statusLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>

                {/* State */}
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 shrink-0 ${statusColor()}`} />
                  <span className={`text-sm font-medium ${statusColor()}`}>{statusLabel()}</span>
                </div>

                {/* Countdown */}
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {keyStatus.isActivated ? 'Expires in' : 'Unused grace expires in'}
                    </p>
                    <p className={`font-mono font-semibold ${keyStatus.isExpired ? 'text-destructive' : ''}`}>
                      {keyStatus.isExpired ? 'Expired' : countdown}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(keyStatus.expiredDate)}</p>
                  </div>
                </div>

                {/* Devices */}
                <div className="flex items-start gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Connected devices</p>
                    <p className="font-semibold">{keyStatus.deviceCount} / 1</p>
                  </div>
                </div>

                {/* Reset devices */}
                <div className="flex items-start gap-2 text-sm">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      Device resets remaining: <strong>{keyStatus.resetsRemaining}</strong> / 2
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      disabled={resetLoading || keyStatus.resetsRemaining === 0 || keyStatus.isExpired}
                      onClick={handleResetDevices}
                    >
                      {resetLoading
                        ? <><Loader2 className="h-3 w-3 animate-spin" />Resetting...</>
                        : <><RefreshCw className="h-3 w-3" />Reset Devices</>
                      }
                    </Button>
                  </div>
                </div>
              </div>

              {/* Allow generating new key only if current one is expired/suspended */}
              {!hasActiveKey && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Your key has expired. You can now generate a new one below.
                </p>
              )}
            </div>
          )}

          {/* ── Generate Form (shown only when no active key exists) ── */}
          {!lookupLoading && !hasActiveKey && (
            <>
              {games.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No free keys available from this reseller.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 flex flex-col items-center">
                    <Label>Game</Label>
                    <Select value={game} onValueChange={v => setGame(v ?? '')}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select game" /></SelectTrigger>
                      <SelectContent>
                        {games.map(g => (
                          <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC1YlrS074UQWwgz'}
                      onSuccess={setTurnstileToken}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={generating || !game || !turnstileToken}
                  >
                    {generating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                      : 'Get Free Key'
                    }
                  </Button>
                </form>
              )}
            </>
          )}

          {/* ── Active key message (hide generate form) ─────────── */}
          {!lookupLoading && hasActiveKey && (
            <p className="text-xs text-center text-muted-foreground">
              You already have an active free key. Come back after it expires to generate a new one.
            </p>
          )}

        </CardContent>
      </Card>
    </div>
  );
}