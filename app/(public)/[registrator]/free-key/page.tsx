'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  Download, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';

interface GameOption {
  code: string;
  name: string;
  downloadLink?: string;
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
  isAdClaim?: boolean;
}

interface TopUser {
  maskedIp: string;
  count: number;
  lastClaim: string;
}

interface StoreInfo {
  storeName: string;
  isActive: boolean;
}

type Tab = 'key' | 'history' | 'downloads' | 'top-users';

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
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState(searchParams.get('game') || '');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('key');
  const [duration, setDuration] = useState<'1h' | '3h'>('1h');

  // Per-game key state
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extendingRequest, setExtendingRequest] = useState(false);

  // History state
  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);
  // Store state
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topUsersLoading, setTopUsersLoading] = useState(false);

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

  const fetchTopUsers = useCallback(async () => {
    setTopUsersLoading(true);
    try {
      const res = await fetch('/api/free-key/top-users?limit=10');
      const data = await res.json();
      setTopUsers(Array.isArray(data) ? data : []);
    } catch {
      setTopUsers([]);
    } finally {
      setTopUsersLoading(false);
    }
  }, []);

  // Fetch history when tab switches to history
  useEffect(() => {
    if (tab === 'history') fetchHistory();
    if (tab === 'top-users') fetchTopUsers();
  }, [tab, fetchHistory, fetchTopUsers]);

  const handleExtendKey = async () => {
    if (!game) return;
    setExtendingRequest(true);
    try {
      const res = await fetch('/api/free-key/extend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, registrator }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.adUrl) {
          toast.success('Redirecting to ad link to extend key...');
          setTimeout(() => {
            window.location.href = data.adUrl;
          }, 1500);
        } else {
          toast.error('Failed to generate extension link');
        }
      } else {
        toast.error(data.error || 'Failed to request extension');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setExtendingRequest(false);
    }
  };

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
    fetch('https://checkip.amazonaws.com')
      .then(res => res.text())
      .then(text => {
        if (text) {
          setIpAddress(text.trim());
        }
      })
      .catch(() => {
        // Fallback to internal API
        fetch('/api/ip')
          .then(r => r.json())
          .then(d => {
            if (d.ip) setIpAddress(d.ip);
          })
          .catch(() => { });
      });

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

    // Handle claim token if present in URL
    const claimToken = searchParams.get('claimToken');
    if (claimToken) {
      const claim = async () => {
        setClaiming(true);
        try {
          const res = await fetch('/api/free-key/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: claimToken }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success('Key claimed successfully!');
            setGame(data.game);
            await fetchMyKey(data.game, true);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            toast.error(data.error || 'Failed to claim key');
          }
        } catch {
          toast.error('Claim error');
        } finally {
          setClaiming(false);
        }
      };
      claim();
    }

    // Handle extend token if present in URL
    const extendToken = searchParams.get('extendToken');
    if (extendToken) {
      const extend = async () => {
        setExtending(true);
        try {
          const res = await fetch('/api/free-key/extend-claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: extendToken }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success('Key extended by 1 hour!');
            setGame(data.game);
            await fetchMyKey(data.game, true);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            toast.error(data.error || 'Failed to extend key');
          }
        } catch {
          toast.error('Extension error');
        } finally {
          setExtending(false);
        }
      };
      extend();
    }
  }, [registrator, searchParams, fetchMyKey]);

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
        body: JSON.stringify({ game, turnstileToken, registrator, duration }),
      });
      const data = await res.json();

      if (res.ok) {
        if (duration === '3h') {
          if (data.adUrl) {
            toast.success('Redirecting to ad link...');
            setTimeout(() => {
              window.location.href = data.adUrl;
            }, 1500);
          } else {
            toast.error('Failed to generate ad link. Please try again later or contact support.');
          }
          return;
        }
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
    { id: 'top-users', label: 'Top Users', icon: <Zap className="h-3.5 w-3.5" /> },
    { id: 'downloads', label: 'Downloads', icon: <Download className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {claiming && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-semibold text-lg animate-pulse">Claiming your 3-hour key...</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your ad completion.</p>
        </div>
      )}
      {extending && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-semibold text-lg animate-pulse">Extending your key...</p>
          <p className="text-sm text-muted-foreground">Please wait while we apply your 1-hour bonus.</p>
        </div>
      )}
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

          {ipAddress && (
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border/50 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-muted-foreground font-medium">Your IP: <span className="font-mono text-foreground">{ipAddress}</span></span>
              </div>
            </div>
          )}

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
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 transition-colors ${tab === t.id
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
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(keyStatus.key)} className="h-7 text-xs gap-1.5">
                        {copied === keyStatus.key
                          ? <><Check className="h-3 w-3" />Copied</>
                          : <><Copy className="h-3 w-3" />Copy Key</>
                        }
                      </Button>
                      {games.find(g => g.code === game)?.downloadLink && (
                        <a
                          href={games.find(g => g.code === game)?.downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'default', size: 'sm' }),
                            "h-7 text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                          )}
                        >
                          <Download className="h-3 w-3" />
                          Download Mod
                        </a>
                      )}
                    </div>
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
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {keyStatus.isActivated ? 'Expires in' : 'Unused grace expires in'}
                          </p>
                          {keyStatus.isActivated && !keyStatus.isExpired && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={handleExtendKey}
                              disabled={extendingRequest}
                              className="h-auto p-0 text-[10px] text-primary font-bold flex items-center gap-1 hover:no-underline"
                            >
                              {extendingRequest ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5" />}
                              Extend Time (+1h)
                            </Button>
                          )}
                        </div>
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
                    <div className="space-y-3">
                      <Label className="text-center block">Select Duration</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDuration('1h')}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1",
                            duration === '1h'
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border/50 hover:border-border text-muted-foreground"
                          )}
                        >
                          <Clock className="h-5 w-5" />
                          <span className="text-sm font-bold">1 Hour</span>
                          <span className="text-[10px] opacity-70">No Ads</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration('3h')}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1",
                            duration === '3h'
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border/50 hover:border-border text-muted-foreground"
                          )}
                        >
                          <Zap className="h-5 w-5" />
                          <span className="text-sm font-bold">3 Hours</span>
                          <span className="text-[10px] opacity-70">With Ads</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC1YlrS074UQWwgz'}
                        onSuccess={setTurnstileToken}
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20" disabled={generating || !turnstileToken}>
                      {generating
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                        : duration === '3h' ? 'Unlock 3h Key (Watch Ads)' : `Get Free ${game} Key`
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
                        <div className="flex items-center gap-2">
                          <HistoryStatusBadge entry={entry} />
                          {entry.isAdClaim ? (
                            <span className="text-[10px] px-1 py-0 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">With Ads</span>
                          ) : (
                            <span className="text-[10px] px-1 py-0 rounded bg-gray-500/10 text-gray-500 font-bold border border-gray-500/20">No Ads</span>
                          )}
                        </div>
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

          {/* ══ DOWNLOADS TAB ════════════════════════════════════════ */}
          {tab === 'downloads' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground text-center">
                Download the official mod files for your selected games.
              </p>

              <div className="space-y-2">
                {games.filter(g => g.downloadLink).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No download links available.</p>
                ) : (
                  games.filter(g => g.downloadLink).map(g => (
                    <div key={g.code} className="rounded-lg border border-border/50 bg-muted/20 p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground font-mono uppercase">{g.code}</p>
                      </div>
                      <a
                        href={g.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          "shrink-0 h-9 gap-2"
                        )}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-tight">
                    Always download from these official links. We are not responsible for files downloaded from third-party sources.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ TOP USERS TAB ════════════════════════════════════════ */}
          {tab === 'top-users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Top Ad Supporters</h3>
                  <p className="text-[10px] text-muted-foreground">Top users claiming keys with ads</p>
                </div>
                <button
                  onClick={fetchTopUsers}
                  disabled={topUsersLoading}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {topUsersLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />
                  }
                </button>
              </div>

              {topUsersLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!topUsersLoading && topUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">No ad claims recorded yet.</p>
              )}

              {!topUsersLoading && topUsers.length > 0 && (
                <div className="space-y-2">
                  {topUsers.map((u, i) => (
                    <div key={u.maskedIp} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                          i === 0 ? "bg-amber-500 text-white" :
                            i === 1 ? "bg-slate-400 text-white" :
                              i === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold">User {u.maskedIp}</p>
                          <p className="text-[10px] text-muted-foreground">Last claim: {formatDate(u.lastClaim)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">{u.count} Claims</p>
                        <p className="text-[9px] text-muted-foreground">With Ads</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-center text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10">
                Supporting us by claiming keys with ads helps keep the service free. Top users get our special appreciation!
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}