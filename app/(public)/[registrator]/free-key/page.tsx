'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/shared/ThemeProvider';
import {
  Moon, Sun, Copy, Check, RefreshCw, Loader2,
  Clock, Smartphone, ShieldAlert, KeyRound, Zap, History, ShoppingBag,
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

interface KeyHistoryEntry {
  key: string;
  game: string;
  generatedAt: string | null;
  expiredDate: string | null;
  status: number;
  isActivated: boolean;
  isExpired: boolean;
}

interface StoreInfo {
  storeName: string;
  isActive: boolean;
}

type Tab = 'key' | 'history';

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

function HistoryStatusBadge({ entry }: { entry: KeyHistoryEntry }) {
  if (entry.status === 0) return <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">Suspended</span>;
  if (entry.isExpired) return <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Expired</span>;
  if (entry.isActivated) return <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 font-medium">Active</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">Unused</span>;
}

export default function FreeKeyPage() {
  const { registrator } = useParams<{ registrator: string }>();
  const { theme, toggleTheme } = useTheme();

  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('key');

  // Per-game key state
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  // History state
  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);
  // Store state
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch key for the selected game
  const fetchMyKey = useCallback(async (selectedGame: string, silent = false) => {
    if (!selectedGame) return;
    if (!silent) setStatusLoading(true);
    setKeyLoading(true);
    try {
      const res = await fetch(
        `/api/free-key/my-key?registrator=${encodeURIComponent(registrator)}&game=${encodeURIComponent(selectedGame)}`
      );
      const data = await res.json();
      setKeyStatus(res.ok ? data : null);
    } catch {
      setKeyStatus(null);
    } finally {
      setStatusLoading(false);
      setKeyLoading(false);
    }
  }, [registrator]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/free-key/history?registrator=${encodeURIComponent(registrator)}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [registrator]);

  // Fetch history when tab switches to history
  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  // When game changes, fetch key for that game
  useEffect(() => {
    if (game) {
      setKeyStatus(null);
      fetchMyKey(game, true);
    } else {
      setKeyStatus(null);
    }
  }, [game, fetchMyKey]);

  // Fetch games list
  useEffect(() => {
    fetch(`/api/free-key/games?registrator=${encodeURIComponent(registrator)}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setGames(list);
        // Auto-select if only one game
        if (list.length === 1) setGame(list[0].code);
      })
      .catch(() => setGames([]));

    // Fetch store info
    fetch(`/api/store?registrator=${encodeURIComponent(registrator)}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setStore(data);
      })
      .catch(() => setStore(null));
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
        await fetchMyKey(game, true);
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

  const handleCopy = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopied(keyStr);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
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
        await fetchMyKey(game, true);
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

  // Active = has key for this game, not expired, not suspended
  const hasActiveKey = keyStatus && !keyStatus.isExpired && keyStatus.status === 1;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'key', label: 'My Key', icon: <KeyRound className="h-3.5 w-3.5" /> },
    {
      id: 'history',
      label: history.length > 0 ? `History (${history.length})` : 'History',
      icon: <History className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center pb-3">
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

          {store && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex flex-col items-center gap-3">
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary">Want more time?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Purchase premium keys with longer duration at our official shop.</p>
                </div>
                <Link
                  href={`/${registrator}/store`}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    "w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold h-9 flex items-center justify-center gap-2"
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Visit {store.storeName}
                </Link>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden mt-3">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 transition-colors ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* ══ MY KEY TAB ══════════════════════════════════════════ */}
          {tab === 'key' && (
            <>
              {/* Game selector — always visible */}
              {games.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No free keys available from this reseller.</p>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Label>Select Game</Label>
                  <Select value={game} onValueChange={v => setGame(v ?? '')}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* No game selected prompt */}
              {!game && games.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Select a game to see your key or generate a new one.
                </p>
              )}

              {/* Key lookup spinner */}
              {game && keyLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Current key panel for selected game */}
              {game && !keyLoading && keyStatus && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/50 bg-muted/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Free Key</span>
                      <span className="text-xs text-muted-foreground font-mono">{keyStatus.game}</span>
                    </div>
                    <p className="font-mono text-sm break-all select-all">{keyStatus.key}</p>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(keyStatus.key)} className="h-7 text-xs gap-1.5">
                      {copied === keyStatus.key
                        ? <><Check className="h-3 w-3" />Copied</>
                        : <><Copy className="h-3 w-3" />Copy Key</>
                      }
                    </Button>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</span>
                      <button
                        onClick={() => fetchMyKey(game)}
                        disabled={statusLoading}
                        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {statusLoading
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 shrink-0 ${statusColor()}`} />
                      <span className={`text-sm font-medium ${statusColor()}`}>{statusLabel()}</span>
                    </div>

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

                    <div className="flex items-start gap-2 text-sm">
                      <Smartphone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Connected devices</p>
                        <p className="font-semibold">{keyStatus.deviceCount} / 1</p>
                      </div>
                    </div>

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
                </div>
              )}

              {/* Generate form — shown when game selected and no active key for that game */}
              {game && !keyLoading && !hasActiveKey && games.length > 0 && (
                <>
                  {keyStatus?.isExpired && (
                    <p className="text-xs text-muted-foreground text-center">
                      Your {game} key has expired. Generate a new one below.
                    </p>
                  )}
                  {!keyStatus && (
                    <p className="text-xs text-muted-foreground text-center">
                      No active {game} key found. Generate one below.
                    </p>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC1YlrS074UQWwgz'}
                        onSuccess={setTurnstileToken}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={generating || !turnstileToken}>
                      {generating
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                        : `Get Free ${game} Key`
                      }
                    </Button>
                  </form>
                </>
              )}

              {game && !keyLoading && hasActiveKey && (
                <p className="text-xs text-center text-muted-foreground pb-1">
                  Come back after your key expires to generate a new one.
                </p>
              )}
            </>
          )}

          {/* ══ HISTORY TAB ═════════════════════════════════════════ */}
          {tab === 'history' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">All keys generated from your IP</p>
                <button
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {historyLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />
                  }
                </button>
              </div>

              {historyLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!historyLoading && history.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">No key history found.</p>
              )}

              {!historyLoading && history.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {history.map((entry, i) => (
                    <div key={entry.key} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">#{history.length - i}</span>
                          <span className="text-xs font-medium">{entry.game}</span>
                        </div>
                        <HistoryStatusBadge entry={entry} />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs text-muted-foreground break-all">{entry.key}</p>
                        <button
                          onClick={() => handleCopy(entry.key)}
                          className="ml-2 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied === entry.key
                            ? <Check className="h-3.5 w-3.5 text-green-500" />
                            : <Copy className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <div>
                          <span className="block">Generated</span>
                          <span className="text-foreground">{formatDate(entry.generatedAt)}</span>
                        </div>
                        <div>
                          <span className="block">Expired</span>
                          <span className="text-foreground">{formatDate(entry.expiredDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!historyLoading && history.length > 0 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  Total keys generated: <strong>{history.length}</strong>
                </p>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}