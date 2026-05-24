'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
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
  Download, Plus, Gamepad2, Timer, Trophy,
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
  duration: string;
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
  if (entry.status === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Suspended</span>;
  if (entry.isExpired) return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Expired</span>;
  if (entry.isActivated) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">Active</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">Unused</span>;
}

export default function FreeKeyPage() {
  const { registrator } = useParams<{ registrator: string }>();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <FreeKeyContent registrator={registrator} />
    </Suspense>
  );
}

function FreeKeyContent({ registrator }: { registrator: string }) {
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState(searchParams.get('game') || '');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('key');
  const [duration, setDuration] = useState<'1h' | '3h'>('1h');

  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extendingRequest, setExtendingRequest] = useState(false);

  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topUsersLoading, setTopUsersLoading] = useState(false);

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

  useEffect(() => {
    if (game) {
      setKeyStatus(null);
      fetchMyKey(game, true);
    } else {
      setKeyStatus(null);
    }
  }, [game, fetchMyKey]);

  useEffect(() => {
    fetch('https://checkip.amazonaws.com')
      .then(res => res.text())
      .then(text => {
        if (text) {
          setIpAddress(text.trim());
        }
      })
      .catch(() => {
        fetch('/api/ip')
          .then(r => r.json())
          .then(d => {
            if (d.ip) setIpAddress(d.ip);
          })
          .catch(() => {});
      });

    fetch(`/api/free-key/games?registrator=${encodeURIComponent(registrator)}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setGames(list);
        if (list.length === 1) setGame(list[0].code);
      })
      .catch(() => setGames([]));

    fetch(`/api/store?registrator=${encodeURIComponent(registrator)}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setStore(data);
      })
      .catch(() => setStore(null));

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
    if (keyStatus.isActivated) {
      const dur = keyStatus.duration === '3h' ? '3h' : '1h';
      return `Active – ${dur} timer running`;
    }
    return 'Unused – grace period (1 day)';
  };

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Claim overlay */}
      {claiming && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-semibold text-lg animate-pulse">Claiming your 3-hour key...</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your ad completion.</p>
        </div>
      )}
      {extending && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-semibold text-lg animate-pulse">Extending your key...</p>
          <p className="text-sm text-muted-foreground">Please wait while we apply your 1-hour bonus.</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span className="font-semibold">Free Key</span>
          </div>
          <div className="flex items-center gap-2">
            {store && (
              <Link
                href={`/${registrator}/store`}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), "h-8 w-8")}
              >
                <ShoppingBag className="h-4 w-4" />
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-1 max-w-lg mx-auto px-4 py-6 md:py-8 space-y-5">

        {/* Hero header */}
        <div className="text-center space-y-3 animate-in fade-in-0 duration-500">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Free Key Generator</h1>
            <p className="text-sm text-muted-foreground">Generate a free {games.length > 1 ? 'trial' : ''} key from <span className="font-medium text-foreground">{registrator}</span></p>
          </div>

          {ipAddress && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/40 border border-border/50 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground font-medium">IP: <span className="font-mono text-foreground">{ipAddress}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex rounded-xl bg-muted/40 border border-border/50 p-1 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg transition-all duration-200 font-medium",
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ MY KEY TAB ══════════════════════════════════════════ */}
        {tab === 'key' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {/* Game selector */}
            {games.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Gamepad2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No free keys available from this reseller.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                    Select Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={game} onValueChange={v => setGame(v ?? '')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {!game && games.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                Select a game to see your key or generate a new one.
              </p>
            )}

            {game && keyLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Status panel */}
            {game && !keyLoading && keyStatus && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      Your Free Key
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">{keyStatus.game}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key display */}
                  <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-mono text-sm break-all select-all tracking-wide">{keyStatus.key}</p>
                      <Button variant="default" size="sm" onClick={() => handleCopy(keyStatus.key)} className="shrink-0 h-8 gap-1.5">
                        {copied === keyStatus.key
                          ? <><Check className="h-3.5 w-3.5" />Copied</>
                          : <><Copy className="h-3.5 w-3.5" />Copy</>
                        }
                      </Button>
                    </div>
                    {games.find(g => g.code === game)?.downloadLink && (
                      <a
                        href={games.find(g => g.code === game)?.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          "w-full h-8 gap-1.5 text-xs"
                        )}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Mod
                      </a>
                    )}
                  </div>

                  {/* Status grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/20 rounded-xl border border-border/50 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Status</span>
                        <button
                          onClick={() => fetchMyKey(game)}
                          disabled={statusLoading}
                          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          {statusLoading
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />
                          }
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", statusColor().replace('text-', 'bg-'))} />
                        <span className={cn("text-sm font-semibold", statusColor())}>{statusLabel()}</span>
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded-xl border border-border/50 p-3 space-y-1.5">
                      <span className="text-xs text-muted-foreground font-medium">Devices</span>
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-semibold">{keyStatus.deviceCount} / 1</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="bg-muted/20 rounded-xl border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {keyStatus.isActivated ? 'Time Remaining' : 'Grace Period Ends'}
                      </span>
                      {keyStatus.isActivated && !keyStatus.isExpired && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleExtendKey}
                          disabled={extendingRequest}
                          className="h-auto p-0 text-xs text-primary font-semibold flex items-center gap-1 hover:no-underline"
                        >
                          {extendingRequest ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          Extend (+1h)
                        </Button>
                      )}
                    </div>
                    <p className={cn(
                      "font-mono text-2xl font-bold tracking-wider",
                      keyStatus.isExpired ? 'text-destructive' : ''
                    )}>
                      {keyStatus.isExpired ? 'Expired' : countdown}
                    </p>
                    {keyStatus.expiredDate && (
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(keyStatus.expiredDate)}</p>
                    )}
                  </div>

                  {/* Reset devices */}
                  <div className="bg-muted/20 rounded-xl border border-border/50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Device Resets</p>
                        <p className="text-xs font-semibold">{keyStatus.resetsRemaining} / 2 remaining</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={resetLoading || keyStatus.resetsRemaining === 0 || keyStatus.isExpired}
                      onClick={handleResetDevices}
                    >
                      {resetLoading
                        ? <><Loader2 className="h-3 w-3 animate-spin" />Resetting...</>
                        : <><RefreshCw className="h-3 w-3" />Reset</>
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate form */}
            {game && !keyLoading && !hasActiveKey && games.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Generate New Key
                  </CardTitle>
                  <CardDescription>
                    {keyStatus?.isExpired
                      ? 'Your key has expired. Generate a new one below.'
                      : 'No active key found. Generate one below.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-muted-foreground">Select Duration</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDuration('1h')}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-1.5",
                            duration === '1h'
                              ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                              : "border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            duration === '1h' ? "bg-primary/10" : "bg-muted"
                          )}>
                            <Clock className={cn("h-5 w-5", duration === '1h' ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <span className="text-sm font-bold">1 Hour</span>
                          <span className="text-[10px] opacity-70 font-medium">No Ads</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration('3h')}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-1.5",
                            duration === '3h'
                              ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                              : "border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            duration === '3h' ? "bg-primary/10" : "bg-muted"
                          )}>
                            <Timer className={cn("h-5 w-5", duration === '3h' ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <span className="text-sm font-bold">3 Hours</span>
                          <span className="text-[10px] opacity-70 font-medium">With Ads</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC1YlrS074UQWwgz'}
                        onSuccess={setTurnstileToken}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                      disabled={generating || !turnstileToken}
                    >
                      {generating
                        ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</>
                        : duration === '3h' ? 'Unlock 3h Key (Watch Ads)' : `Get Free ${game} Key`
                      }
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {game && !keyLoading && hasActiveKey && (
              <p className="text-xs text-center text-muted-foreground">
                Come back after your key expires to generate a new one.
              </p>
            )}

            {/* Store promotion */}
            {store && (
              <div className="bg-gradient-to-br from-primary/[0.04] to-transparent rounded-2xl border border-primary/15 p-5 space-y-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-primary">Want more time?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Purchase premium keys with longer duration at our official shop.</p>
                </div>
                <Link
                  href={`/${registrator}/store`}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'lg' }),
                    "w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold h-11 flex items-center justify-center gap-2"
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Visit {store.storeName}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ═════════════════════════════════════════ */}
        {tab === 'history' && (
          <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
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
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No key history found.</p>
                </CardContent>
              </Card>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {history.map((entry, i) => (
                  <div key={entry.key} className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">#{history.length - i}</span>
                        <span className="text-xs font-semibold">{entry.game}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HistoryStatusBadge entry={entry} />
                        {entry.isAdClaim ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">With Ads</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/10 text-gray-500 font-semibold border border-gray-500/20">No Ads</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2 border border-border/30">
                      <p className="font-mono text-xs text-muted-foreground flex-1 truncate select-all">{entry.key}</p>
                      <button
                        onClick={() => handleCopy(entry.key)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === entry.key
                          ? <Check className="h-3.5 w-3.5 text-green-500" />
                          : <Copy className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-muted/20 rounded-lg p-2">
                        <span className="block text-muted-foreground mb-0.5">Generated</span>
                        <span className="text-foreground font-medium">{formatDate(entry.generatedAt)}</span>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-2">
                        <span className="block text-muted-foreground mb-0.5">Expired</span>
                        <span className="text-foreground font-medium">{formatDate(entry.expiredDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="bg-muted/20 rounded-xl border border-border/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Total keys generated: <strong className="text-foreground">{history.length}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══ DOWNLOADS TAB ════════════════════════════════════════ */}
        {tab === 'downloads' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <p className="text-xs text-muted-foreground text-center">
              Download the official mod files for your selected games.
            </p>

            <div className="space-y-2">
              {games.filter(g => g.downloadLink).length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center">
                    <Download className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No download links available.</p>
                  </CardContent>
                </Card>
              ) : (
                games.filter(g => g.downloadLink).map(g => (
                  <div key={g.code} className="rounded-xl border border-border/50 bg-muted/10 p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
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

            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <div className="flex gap-3">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  Always download from these official links. We are not responsible for files downloaded from third-party sources.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ TOP USERS TAB ════════════════════════════════════════ */}
        {tab === 'top-users' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Top Ad Supporters
                </h3>
                <p className="text-[10px] text-muted-foreground">Users claiming keys with ads</p>
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
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!topUsersLoading && topUsers.length === 0 && (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No ad claims recorded yet.</p>
                </CardContent>
              </Card>
            )}

            {!topUsersLoading && topUsers.length > 0 && (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={u.maskedIp} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold",
                        i === 0 ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" :
                          i === 1 ? "bg-slate-400/15 text-slate-400 border border-slate-400/30" :
                            i === 2 ? "bg-amber-700/15 text-amber-700 border border-amber-700/30" : "bg-muted text-muted-foreground"
                      )}>
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold">User {u.maskedIp}</p>
                        <p className="text-[10px] text-muted-foreground">Last claim: {formatDate(u.lastClaim)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">{u.count}</p>
                      <p className="text-[9px] text-muted-foreground">Claims</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-primary/[0.03] rounded-xl border border-primary/10 p-4 text-center">
              <p className="text-[10px] text-muted-foreground">
                Supporting us by claiming keys with ads helps keep the service free. Top users get our special appreciation!
              </p>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(40px, 30px) scale(1.05); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-40px, 30px) scale(0.95); }
          50% { transform: translate(20px, -40px) scale(1.1); }
          75% { transform: translate(-30px, -20px) scale(1); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          33% { transform: translate(50px, 20px) scale(0.9); }
          66% { transform: translate(-30px, -40px) scale(1.1); }
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
          will-change: transform;
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: oklch(0.5 0.2 270);
          top: -10%; left: -5%;
          animation: orb-drift-1 20s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: oklch(0.6 0.15 200);
          bottom: -5%; right: -10%;
          animation: orb-drift-2 25s ease-in-out infinite;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: oklch(0.4 0.18 300);
          top: 40%; right: 20%;
          animation: orb-drift-3 18s ease-in-out infinite;
        }
        .grain-overlay {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }
        @media (prefers-reduced-motion: reduce) {
          .orb { animation: none; }
        }
      `}</style>
    </div>
  );
}
