'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/shared/ThemeProvider';
import {
  Moon, Sun, Copy, Check, RefreshCw, Loader2,
  Clock, Smartphone, ShieldAlert, KeyRound, Zap, History, ShoppingBag,
  Download, Plus, Gamepad2, Timer, Trophy, ArrowRight, Sparkles, Star,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';
import { ParticleField } from '@/components/landing/ParticleField';
import { SpotlightCursor } from '@/components/landing/SpotlightCursor';

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
  if (entry.status === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium border border-destructive/20">Suspended</span>;
  if (entry.isExpired) return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border/50">Expired</span>;
  if (entry.isActivated) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium border border-green-500/20">Active</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">Unused</span>;
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
  const containerRef = useRef<HTMLDivElement>(null);

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
          setTimeout(() => { window.location.href = data.adUrl; }, 1500);
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
      .then(text => { if (text) setIpAddress(text.trim()); })
      .catch(() => {
        fetch('/api/ip')
          .then(r => r.json())
          .then(d => { if (d.ip) setIpAddress(d.ip); })
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
      .then(data => { if (data && !data.error) setStore(data); })
      .catch(() => setStore(null));

    const claimToken = searchParams.get('claimToken');
    if (claimToken) {
      const claim = async () => {
        setClaiming(true);
        try {
          const res = await fetch('/api/free-key/claim', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        } catch { toast.error('Claim error'); }
        finally { setClaiming(false); }
      };
      claim();
    }

    const extendToken = searchParams.get('extendToken');
    if (extendToken) {
      const extend = async () => {
        setExtending(true);
        try {
          const res = await fetch('/api/free-key/extend-claim', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        } catch { toast.error('Extension error'); }
        finally { setExtending(false); }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, turnstileToken, registrator, duration }),
      });
      const data = await res.json();

      if (res.ok) {
        if (duration === '3h') {
          if (data.adUrl) {
            toast.success('Redirecting to ad link...');
            setTimeout(() => { window.location.href = data.adUrl; }, 1500);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyStatus.key }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Devices reset! ${data.resetsRemaining} reset(s) remaining.`);
        await fetchMyKey(game, true);
      } else {
        toast.error(data.error || 'Failed to reset devices');
      }
    } catch { toast.error('Network error'); }
    finally { setResetLoading(false); }
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
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="freekey-orb freekey-orb-1" />
        <div className="freekey-orb freekey-orb-2" />
        <div className="freekey-orb freekey-orb-3" />
        <div className="freekey-orb freekey-orb-4" />
      </div>

      {/* Particle field */}
      <ParticleField />

      {/* Spotlight cursor */}
      <SpotlightCursor />

      {/* Grain overlay */}
      <div className="freekey-grain" />

      {/* Claim overlay */}
      {claiming && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
          <p className="font-bold text-lg animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Claiming your 3-hour key...</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your ad completion.</p>
        </div>
      )}
      {extending && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
          <p className="font-bold text-lg animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Extending your key...</p>
          <p className="text-sm text-muted-foreground">Please wait while we apply your 1-hour bonus.</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <KeyRound className="h-5 w-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Free Key</span>
          </div>
          <div className="flex items-center gap-1">
            {store && (
              <Link
                href={`/${registrator}/store`}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), "h-8 w-8 group")}
              >
                <ShoppingBag className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
        <div className="text-center space-y-4 animate-in fade-in-0 duration-500">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 group fk-glow-card">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
            <KeyRound className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -top-1 -right-1 size-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full size-3 bg-green-500" />
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground/60 fk-title">Free Key Generator</h1>
              <Sparkles className="fk-sparkle absolute -top-2 -right-6 h-4 w-4 text-primary" />
              <Sparkles className="fk-sparkle-delayed absolute -bottom-1 -left-6 h-3 w-3 text-amber-400" />
            </div>
            <p className="text-sm text-muted-foreground">Generate a free trial key from <span className="font-bold text-foreground">{registrator}</span></p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border animate-pulse" style={{ background: 'hsla(145, 70%, 50%, 0.08)', borderColor: 'hsla(145, 70%, 50%, 0.2)', color: 'hsl(145, 70%, 45%)' }}>
              <Sparkles className="size-3" /> Free Trial
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'hsla(250, 70%, 60%, 0.08)', borderColor: 'hsla(250, 70%, 60%, 0.2)', color: 'hsl(250, 70%, 60%)' }}>
              <Zap className="size-3" /> Instant Access
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'hsla(30, 90%, 55%, 0.08)', borderColor: 'hsla(30, 90%, 55%, 0.2)', color: 'hsl(30, 90%, 50%)' }}>
              <ShieldCheck className="size-3" /> No Virus
            </div>
          </div>

          {ipAddress && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 backdrop-blur-sm group hover:border-primary/20 transition-colors" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.05))' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground font-medium">IP: <span className="font-mono font-bold text-foreground">{ipAddress}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Glowing tab navigation */}
        <div className="flex rounded-xl p-1 gap-1 border border-border/50" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.04))' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg transition-all duration-300 font-semibold relative",
                tab === t.id
                  ? 'bg-background text-foreground shadow-lg shadow-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab === t.id && (
                <span className="absolute inset-0 rounded-lg border border-primary/20" />
              )}
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ MY KEY TAB ══════════════════════════════════════════ */}
        {tab === 'key' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-400">
            {/* Game selector */}
            {games.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-14 text-center">
                  <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No free keys available from this reseller.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 hover:border-primary/20 transition-colors duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Select Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={game} onValueChange={v => setGame(v ?? '')}>
                    <SelectTrigger className="w-full border-border/50 focus:border-primary/30 transition-colors">
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
              <div className="flex justify-center py-8">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <div className="absolute inset-0 rounded-full border-2 border-border/30 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
              </div>
            )}

            {/* Status panel */}
            {game && !keyLoading && keyStatus && (
              <div className="rounded-2xl border border-border/50 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-primary/20" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                <div className="p-5 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <KeyRound className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold">Your Free Key</span>
                    </div>
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-lg border border-border/50 bg-muted/30" style={{ color: 'var(--landing-text-muted, oklch(0.5 0 0))' }}>{keyStatus.game}</span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Key display */}
                  <div className="rounded-xl border border-border/40 p-4 space-y-3 relative overflow-hidden group" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.04))' }}>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ boxShadow: 'inset 0 0 40px hsla(145, 70%, 50%, 0.05)' }}
                    />
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm break-all select-all tracking-wide font-semibold">{keyStatus.key}</p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCopy(keyStatus.key)}
                        className="shrink-0 h-9 gap-1.5 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                      >
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
                          "w-full h-9 gap-1.5 text-xs font-semibold relative z-10"
                        )}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Mod File
                      </a>
                    )}
                  </div>

                  {/* Status grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/40 p-3.5 space-y-2" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Status</span>
                        <button
                          onClick={() => fetchMyKey(game)}
                          disabled={statusLoading}
                          className="text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                        >
                          {statusLoading
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3 hover:rotate-180 transition-transform duration-500" />
                          }
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", statusColor().replace('text-', 'bg-'))} />
                        <span className={cn("text-sm font-bold", statusColor())}>{statusLabel()}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/40 p-3.5 space-y-2" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Devices</span>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-bold">{keyStatus.deviceCount} / 1</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="rounded-xl border border-border/40 p-4 relative overflow-hidden" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                    {keyStatus.isActivated && !keyStatus.isExpired && (
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, hsla(145, 70%, 50%, 0.03), transparent)' }} />
                    )}
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        {keyStatus.isActivated ? '⏱ Time Remaining' : '⏳ Grace Period Ends'}
                      </span>
                      {keyStatus.isActivated && !keyStatus.isExpired && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleExtendKey}
                          disabled={extendingRequest}
                          className="h-auto p-0 text-xs font-bold flex items-center gap-1 hover:no-underline text-primary group"
                        >
                          {extendingRequest
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform duration-300" />
                          }
                          Extend (+1h)
                        </Button>
                      )}
                    </div>
                    <p className={cn(
                      "font-mono text-3xl font-black tracking-wider relative z-10",
                      keyStatus.isExpired ? 'text-destructive' : ''
                    )}>
                      {keyStatus.isExpired ? 'Expired' : countdown}
                    </p>
                    {keyStatus.expiredDate && (
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium relative z-10">{formatDate(keyStatus.expiredDate)}</p>
                    )}
                  </div>

                  {/* Reset devices */}
                  <div className="rounded-xl border border-border/40 p-3.5 flex items-center justify-between" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Device Resets</p>
                        <p className="text-[10px] font-semibold text-muted-foreground">{keyStatus.resetsRemaining} / 2 remaining</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 font-semibold border-border/50 hover:border-primary/30 transition-all"
                      disabled={resetLoading || keyStatus.resetsRemaining === 0 || keyStatus.isExpired}
                      onClick={handleResetDevices}
                    >
                      {resetLoading
                        ? <><Loader2 className="h-3 w-3 animate-spin" />Resetting...</>
                        : <><RefreshCw className="h-3 w-3" />Reset</>
                      }
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Generate form */}
            {game && !keyLoading && !hasActiveKey && games.length > 0 && (
              <div className="rounded-2xl border border-border/50 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-primary/20" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                <div className="p-5 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold">Generate New Key</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {keyStatus?.isExpired
                      ? 'Your key has expired. Generate a new one below.'
                      : 'No active key found. Generate one below.'
                    }
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Choose Duration</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDuration('1h')}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 gap-1.5 relative overflow-hidden group",
                            duration === '1h'
                              ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                              : "border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {duration === '1h' && (
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, hsla(145, 70%, 50%, 0.05), transparent)' }} />
                          )}
                          <div className={cn(
                            "size-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                            duration === '1h' ? "bg-primary/15" : "bg-muted"
                          )}>
                            <Clock className={cn("h-5 w-5", duration === '1h' ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <span className="text-sm font-extrabold relative z-10">1 Hour</span>
                          <span className="text-[10px] font-bold opacity-70 relative z-10">No Ads</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration('3h')}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 gap-1.5 relative overflow-hidden group",
                            duration === '3h'
                              ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10"
                              : "border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {duration === '3h' && (
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, hsla(250, 70%, 60%, 0.05), transparent)' }} />
                          )}
                          <div className={cn(
                            "size-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                            duration === '3h' ? "bg-primary/15" : "bg-muted"
                          )}>
                            <Timer className={cn("h-5 w-5", duration === '3h' ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <span className="text-sm font-extrabold relative z-10">3 Hours</span>
                          <span className="text-[10px] font-bold opacity-70 relative z-10">With Ads</span>
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
                      className="group relative w-full h-12 text-base font-extrabold overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/25 hover:shadow-primary/40"
                      disabled={generating || !turnstileToken}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary" />
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {generating
                          ? <><Loader2 className="h-5 w-5 animate-spin" />Generating...</>
                          : duration === '3h'
                            ? <><Zap className="h-5 w-5" />Unlock 3h Key (Watch Ads)</>
                            : <><Sparkles className="h-5 w-5" />Get Free {game} Key</>
                        }
                      </span>
                    </Button>

                    <div className="text-center pt-2 mt-2 border-t border-border/10">
                      <p className="text-[11px] text-muted-foreground">
                        Support our servers by visiting our{" "}
                        <a
                          href="https://www.effectivecpmnetwork.com/af3m3ncy4?key=d3dfc16b1bccb6cf90bb7c5871ecb083"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          Sponsor Link
                        </a>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {game && !keyLoading && hasActiveKey && (
              <p className="text-xs text-center text-muted-foreground font-medium">
                Come back after your key expires to generate a new one.
              </p>
            )}

            {/* Store promotion */}
            {store && (
              <div className="relative rounded-2xl overflow-hidden p-6 space-y-4 group" style={{ background: 'linear-gradient(135deg, hsla(145, 70%, 50%, 0.05), transparent)', border: '1px solid hsla(145, 70%, 50%, 0.15)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, hsla(145, 70%, 50%, 0.03), transparent)' }} />
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 mb-3">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Want more time?</p>
                  <p className="text-xs text-muted-foreground mt-1">Purchase premium keys with longer duration at our official shop.</p>
                </div>
                <Link
                  href={`/${registrator}/store`}
                  className="group/link relative flex items-center justify-center gap-2 w-full h-11 rounded-xl font-bold text-sm text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/80 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Visit {store.storeName}
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ═════════════════════════════════════════ */}
        {tab === 'history' && (
          <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-400">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">All keys generated from your IP</p>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              >
                {historyLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="h-3.5 w-3.5 hover:rotate-180 transition-transform duration-500" />
                }
              </button>
            </div>

            {historyLoading && (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <div className="absolute inset-0 rounded-full border-2 border-border/30 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="rounded-2xl border border-border/50 py-14 text-center backdrop-blur-sm" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No key history found.</p>
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {history.map((entry, i) => (
                  <div key={entry.key} className="rounded-xl border border-border/50 p-4 space-y-3 transition-all duration-200 hover:border-primary/20 backdrop-blur-sm group" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-lg border border-border/50 bg-muted/30">#{history.length - i}</span>
                        <span className="text-xs font-extrabold">{entry.game}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HistoryStatusBadge entry={entry} />
                        {entry.isAdClaim ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold border" style={{ background: 'hsla(250, 70%, 60%, 0.08)', borderColor: 'hsla(250, 70%, 60%, 0.2)', color: 'hsl(250, 70%, 60%)' }}>With Ads</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold border text-muted-foreground" style={{ borderColor: 'var(--glass-border, oklch(0.5 0 0 / 0.1))' }}>No Ads</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg p-2.5 border border-border/30" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.04))' }}>
                      <p className="font-mono text-xs text-muted-foreground flex-1 truncate select-all font-semibold">{entry.key}</p>
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
                      <div className="rounded-lg p-2.5 border border-border/30" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Generated</span>
                        <span className="font-bold">{formatDate(entry.generatedAt)}</span>
                      </div>
                      <div className="rounded-lg p-2.5 border border-border/30" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Expired</span>
                        <span className="font-bold">{formatDate(entry.expiredDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="rounded-xl border border-border/50 p-3.5 text-center backdrop-blur-sm" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                <p className="text-xs text-muted-foreground font-medium">
                  Total keys generated: <strong className="text-foreground text-sm">{history.length}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══ DOWNLOADS TAB ════════════════════════════════════════ */}
        {tab === 'downloads' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-400">
            <p className="text-xs text-muted-foreground text-center font-medium">
              Download the official mod files for your selected games.
            </p>

            <div className="space-y-2">
              {games.filter(g => g.downloadLink).length === 0 ? (
                <div className="rounded-2xl border border-border/50 py-14 text-center backdrop-blur-sm" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No download links available.</p>
                </div>
              ) : (
                games.filter(g => g.downloadLink).map(g => (
                  <div key={g.code} className="rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:border-primary/20 backdrop-blur-sm group" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{g.name}</p>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider font-semibold">{g.code}</p>
                    </div>
                    <a
                      href={g.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        "shrink-0 h-9 gap-2 font-semibold border-border/50 hover:border-primary/30 transition-all group-hover:shadow-lg group-hover:shadow-primary/10"
                      )}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl p-4 border" style={{ background: 'hsla(40, 90%, 50%, 0.04)', borderColor: 'hsla(40, 90%, 50%, 0.12)' }}>
              <div className="flex gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium" style={{ color: 'hsl(40, 80%, 45%)' }}>
                  Always download from these official links. We are not responsible for files downloaded from third-party sources.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ TOP USERS TAB ════════════════════════════════════════ */}
        {tab === 'top-users' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Top Ad Supporters
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium">Users claiming keys with ads</p>
              </div>
              <button
                onClick={fetchTopUsers}
                disabled={topUsersLoading}
                className="text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              >
                {topUsersLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="h-3.5 w-3.5 hover:rotate-180 transition-transform duration-500" />
                }
              </button>
            </div>

            {topUsersLoading && (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <div className="absolute inset-0 rounded-full border-2 border-border/30 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
              </div>
            )}

            {!topUsersLoading && topUsers.length === 0 && (
              <div className="rounded-2xl border border-border/50 py-14 text-center backdrop-blur-sm" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No ad claims recorded yet.</p>
              </div>
            )}

            {!topUsersLoading && topUsers.length > 0 && (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={u.maskedIp} className="flex items-center justify-between p-4 rounded-xl border border-border/50 transition-all duration-200 hover:border-primary/20 backdrop-blur-sm group" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all duration-300 group-hover:scale-110",
                        i === 0 ? "bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-lg shadow-amber-500/10" :
                          i === 1 ? "bg-slate-400/15 text-slate-400 border-slate-400/30" :
                            i === 2 ? "bg-amber-700/15 text-amber-700 border-amber-700/30" : "bg-muted text-muted-foreground border-border/50"
                      )}>
                        {i === 0 ? <Trophy className="h-4 w-4" /> : `#${i + 1}`}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-extrabold">User {u.maskedIp}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Last claim: {formatDate(u.lastClaim)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{u.count}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Claims</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl p-4 text-center border backdrop-blur-sm" style={{ background: 'hsla(145, 70%, 50%, 0.03)', borderColor: 'hsla(145, 70%, 50%, 0.1)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--landing-text-subtle, oklch(0.5 0 0))' }}>
                Supporting us by claiming keys with ads helps keep the service free. Top users get our special appreciation!
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Ad Scripts (Hoisted automatically by React / Next.js) */}
      <Script src="https://pl29635888.effectivecpmnetwork.com/76/e9/92/76e9921dd32b21981772bb0a3f32976a.js" strategy="afterInteractive" />
      <Script src="https://pl29635890.effectivecpmnetwork.com/df/d6/32/dfd632caec23bf46fbb7d22a48bead7d.js" strategy="lazyOnload" />

      {/* Ad Banner Container */}
      <div className="max-w-lg mx-auto px-4 pb-6 flex flex-col items-center justify-center gap-2 relative z-10">
        <div id="container-11549e9ed33a224ea077baba528d1381" className="w-full min-h-[50px] flex items-center justify-center" />
        <Script async src="https://pl29635891.effectivecpmnetwork.com/11549e9ed33a224ea077baba528d1381/invoke.js" data-cfasync="false" strategy="afterInteractive" />
      </div>

      <style>{`
        @keyframes fk-orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.08); }
          50% { transform: translate(-20px, 20px) scale(0.92); }
          75% { transform: translate(40px, 30px) scale(1.05); }
        }
        @keyframes fk-orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-40px, 30px) scale(0.92); }
          50% { transform: translate(20px, -40px) scale(1.08); }
          75% { transform: translate(-30px, -20px) scale(1); }
        }
        @keyframes fk-orb-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, 20px) scale(0.88); }
          66% { transform: translate(-30px, -40px) scale(1.12); }
        }
        @keyframes fk-orb-drift-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -30px) scale(1.06); }
        }
        @keyframes fk-title-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fk-sparkle-float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-8px) rotate(180deg); opacity: 1; }
        }
        @keyframes fk-glow-pulse {
          0%, 100% { box-shadow: 0 0 8px oklch(0.5 0.25 270 / 0.1); }
          50% { box-shadow: 0 0 30px oklch(0.5 0.25 270 / 0.2), 0 0 60px oklch(0.6 0.2 200 / 0.1); }
        }
        .freekey-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          will-change: transform;
          pointer-events: none;
          transition: opacity 0.5s;
        }
        .freekey-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, oklch(0.5 0.3 270), oklch(0.4 0.2 300));
          top: -20%; right: -15%;
          opacity: 0.15;
          animation: fk-orb-drift-1 22s ease-in-out infinite;
        }
        :root:not(.dark) .freekey-orb-1 {
          opacity: 0.07;
        }
        .freekey-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, oklch(0.6 0.25 200), oklch(0.5 0.2 180));
          bottom: -15%; left: -15%;
          opacity: 0.12;
          animation: fk-orb-drift-2 25s ease-in-out infinite;
        }
        :root:not(.dark) .freekey-orb-2 {
          opacity: 0.06;
        }
        .freekey-orb-3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, oklch(0.4 0.25 300), oklch(0.35 0.2 330));
          top: 40%; left: 60%;
          opacity: 0.1;
          animation: fk-orb-drift-3 18s ease-in-out infinite;
        }
        :root:not(.dark) .freekey-orb-3 {
          opacity: 0.05;
        }
        .freekey-orb-4 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, oklch(0.65 0.25 150), oklch(0.55 0.2 130));
          top: 15%; left: 20%;
          opacity: 0.09;
          animation: fk-orb-drift-4 15s ease-in-out infinite;
        }
        :root:not(.dark) .freekey-orb-4 {
          opacity: 0.04;
        }
        .freekey-grain {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }
        :root.dark .freekey-grain {
          opacity: 0.035;
        }
        .fk-title {
          background-size: 200% auto;
          animation: fk-title-shimmer 4s linear infinite;
        }
        .fk-sparkle {
          animation: fk-sparkle-float 3s ease-in-out infinite;
        }
        .fk-sparkle-delayed {
          animation: fk-sparkle-float 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .fk-glow-card {
          animation: fk-glow-pulse 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .freekey-orb { animation: none; }
          .fk-title { animation: none; }
          .fk-sparkle { animation: none; }
          .fk-sparkle-delayed { animation: none; }
          .fk-glow-card { animation: none; }
        }
      `}</style>
    </div>
  );
}
