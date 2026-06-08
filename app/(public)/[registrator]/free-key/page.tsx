'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Copy, Check, RefreshCw, Loader2,
  Smartphone, ShieldAlert, KeyRound, Zap, History, ShoppingBag,
  Download, Gamepad2, Timer, Trophy, ArrowRight, Sparkles,
  ShieldCheck, Cpu, AlertTriangle, Activity, Globe, ExternalLink, Hash, Calendar,
  LogIn, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';
import { GradientOrbs } from '@/components/landing/GradientOrbs';
import { SparkleCanvas } from '@/components/landing/SparkleCanvas';
import { GrainOverlay } from '@/components/landing/GrainOverlay';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface GameOption { code: string; name: string; downloadLink?: string; }
interface KeyStatus {
  key: string; game: string; status: number; isActivated: boolean; isExpired: boolean;
  expiredDate: string | null; deviceCount: number; resetsRemaining: number; duration: string;
}
interface KeyHistoryEntry {
  key: string; game: string; generatedAt: string | null; expiredDate: string | null;
  status: number; isActivated: boolean; isExpired: boolean; isAdClaim?: boolean;
}
interface TopUser { username: string; count: number; lastClaim: string; }
interface StoreInfo { storeName: string; isActive: boolean; }
interface AuthUser { username: string; fullname: string; level: number; }
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
  if (entry.status === 0) return <StatusBadge status="blocked">Suspended</StatusBadge>;
  if (entry.isExpired) return <StatusBadge status="expired">Expired</StatusBadge>;
  if (entry.isActivated) return <StatusBadge status="active" withDot>Active</StatusBadge>;
  return <StatusBadge status="warning">Unused</StatusBadge>;
}

export default function FreeKeyPage() {
  const { registrator } = useParams<{ registrator: string }>();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <GradientOrbs />
        <div className="relative z-10">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--teal-2)' }} />
        </div>
      </div>
    }>
      <FreeKeyContent registrator={registrator} />
    </Suspense>
  );
}

function FreeKeyContent({ registrator }: { registrator: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState(searchParams.get('game') || '');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('key');

  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [claiming, setClaiming] = useState(false);

  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topUsersLoading, setTopUsersLoading] = useState(false);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchMyKey = useCallback(async (selectedGame: string, silent = false) => {
    if (!selectedGame) return;
    if (!silent) setStatusLoading(true);
    setKeyLoading(true);
    try {
      const res = await fetch(`/api/free-key/my-key?registrator=${encodeURIComponent(registrator)}&game=${encodeURIComponent(selectedGame)}`);
      const data = await res.json();
      setKeyStatus(res.ok ? data : null);
    } catch { setKeyStatus(null); }
    finally { setStatusLoading(false); setKeyLoading(false); }
  }, [registrator]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/free-key/history?registrator=${encodeURIComponent(registrator)}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  }, [registrator]);

  const fetchTopUsers = useCallback(async () => {
    setTopUsersLoading(true);
    try {
      const res = await fetch('/api/free-key/top-users?limit=10');
      const data = await res.json();
      setTopUsers(Array.isArray(data) ? data : []);
    } catch { setTopUsers([]); }
    finally { setTopUsersLoading(false); }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAuthUser(data.user);
        }
      } catch {}
      finally { setAuthLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (tab === 'history') void fetchHistory();
    if (tab === 'top-users') void fetchTopUsers();
  }, [tab, fetchHistory, fetchTopUsers]);

  useEffect(() => {
    if (game) { setKeyStatus(null); void fetchMyKey(game, true); }
  }, [game, fetchMyKey]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('https://checkip.amazonaws.com');
        const text = await r.text();
        if (text) setIpAddress(text.trim());
      } catch {
        try {
          const r = await fetch('/api/ip');
          const d = await r.json();
          if (d.ip) setIpAddress(d.ip);
        } catch {}
      }
    })();

    void (async () => {
      try {
        const res = await fetch(`/api/free-key/games?registrator=${encodeURIComponent(registrator)}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setGames(list);
        if (list.length === 1) setGame(list[0].code);
      } catch { setGames([]); }
    })();

    void (async () => {
      try {
        const res = await fetch(`/api/store?registrator=${encodeURIComponent(registrator)}`);
        const data = await res.json();
        if (data && !data.error) setStore(data);
      } catch { setStore(null); }
    })();

    const claimToken = searchParams.get('claimToken');
    if (claimToken) {
      void (async () => {
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
          } else toast.error(data.error || 'Failed to claim key');
        } catch { toast.error('Claim error'); }
        finally { setClaiming(false); }
      })();
    }
  }, [registrator, searchParams, fetchMyKey]);

  useEffect(() => {
    if (!keyStatus?.expiredDate) { setCountdown(''); return; }
    const tick = () => setCountdown(formatCountdown(keyStatus.expiredDate));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [keyStatus?.expiredDate]);

  useEffect(() => {
    const container = document.getElementById('container-11549e9ed33a224ea077baba528d1381');
    if (container && !container.hasChildNodes()) {
      const script = document.createElement('script');
      script.src = 'https://pl29635891.effectivecpmnetwork.com/11549e9ed33a224ea077baba528d1381/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      container.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast.error('Please register or sign in to generate keys');
      router.push('/register');
      return;
    }
    if (!turnstileToken) { toast.error('Complete captcha verification'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/free-key', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, turnstileToken, registrator, duration: '3h' }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.adUrl) {
          toast.success('Redirecting to ad link…');
          setTimeout(() => { window.location.href = data.adUrl; }, 1500);
        } else toast.error('Failed to generate ad link. Please try again later or contact support.');
      } else toast.error(data.error || 'Failed to generate key');
    } catch { toast.error('Network error'); }
    finally { setGenerating(false); setTurnstileToken(''); }
  };

  const handleCopy = (keyStr: string) => {
    void navigator.clipboard.writeText(keyStr);
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
      } else toast.error(data.error || 'Failed to reset devices');
    } catch { toast.error('Network error'); }
    finally { setResetLoading(false); }
  };

  const hasActiveKey = keyStatus && !keyStatus.isExpired && keyStatus.status === 1;

  const tabs: { id: Tab; label: string; Icon: typeof KeyRound; count?: number }[] = [
    { id: 'key',        label: 'My Key',    Icon: KeyRound },
    { id: 'history',    label: 'History',   Icon: History, count: history.length || undefined },
    { id: 'top-users',  label: 'Top Users', Icon: Trophy },
    { id: 'downloads',  label: 'Downloads', Icon: Download },
  ];

  return (
    <div className="min-h-screen relative">
      <GradientOrbs />
      <SparkleCanvas />
      <GrainOverlay />

      {claiming && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(2, 6, 8, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--teal-2)' }} />
          <p
            className="font-display text-lg font-bold tracking-wide"
            style={{ background: 'linear-gradient(135deg, var(--teal-3), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Claiming your 3-hour key…
          </p>
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>Please wait while we verify your ad completion.</p>
        </div>
      )}

      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(2, 6, 8, 0.7)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" style={{ color: 'var(--teal-2)' }} />
            <span className="font-display font-bold tracking-wide" style={{ color: 'var(--text-hi)' }}>Free Key</span>
          </div>
          <div className="flex items-center gap-1">
            {store && (
              <Link href={`/${registrator}/store`} aria-label="Open store">
                <Button variant="ghost" size="icon-sm"><ShoppingBag className="h-4 w-4" /></Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-6 md:py-8 space-y-5">
        {!authLoading && !authUser && (
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: 'rgba(20, 184, 184, 0.06)', border: '1px solid rgba(20, 184, 184, 0.2)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20, 184, 184, 0.12)', border: '1px solid rgba(20, 184, 184, 0.25)' }}>
                <LogIn className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-hi)' }}>Sign in to generate keys</p>
                <p className="text-xs" style={{ color: 'var(--text-mid)' }}>Create an account to claim free keys and track your history.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="h-3.5 w-3.5" /> Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Register
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl"
               style={{ background: 'rgba(20, 184, 184, 0.1)', border: '1px solid rgba(20, 184, 184, 0.3)' }}>
            <KeyRound className="h-10 w-10" style={{ color: 'var(--teal-2)' }} />
            <span className="absolute -top-1 -right-1 size-3">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: 'var(--ecto-green)' }} />
              <span className="relative inline-flex rounded-full size-3" style={{ background: 'var(--ecto-green)' }} />
            </span>
          </div>

          <div className="space-y-2">
            <h1
              className="font-display text-4xl md:text-5xl font-black tracking-tight"
              style={{ background: 'linear-gradient(135deg, var(--text-hi), var(--teal-2), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Free Key Generator
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
              Generate a free trial key from <span className="font-bold" style={{ color: 'var(--text-hi)' }}>{registrator}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="status-pill-active"><Sparkles className="h-3 w-3" /> Free Trial</span>
            <span className="status-pill-warning"><Zap className="h-3 w-3" /> Instant Access</span>
            <span className="status-pill-gold"><ShieldCheck className="h-3 w-3" /> No Virus</span>
          </div>

          {ipAddress && (
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(20, 184, 184, 0.04)', border: '1px solid var(--border)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--ecto-green)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--ecto-green)' }} />
                </span>
                <span className="text-xs" style={{ color: 'var(--text-mid)' }}>
                  <span className="font-mono uppercase tracking-widest" style={{ color: 'var(--text-lo)', fontSize: '0.65rem' }}>IP:</span>{' '}
                  <span className="font-mono font-bold" style={{ color: 'var(--text-hi)' }}>{ipAddress}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'rgba(2, 6, 8, 0.5)', border: '1px solid var(--border)' }}
        >
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={tab === t.id ? 'tab-btn active' : 'tab-btn'}
            >
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && <span className="badge-count">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'key' && (
          <div className="space-y-4 fade-up d1">
            {games.length === 0 ? (
              <Card>
                <CardContent className="empty-state">
                  <div className="empty-icon-ring"><Gamepad2 size={26} /></div>
                  <div className="empty-title">No Free Keys Available</div>
                  <div className="empty-sub">No free keys available from this reseller.</div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="panel-icon">
                      <Gamepad2 className="h-3.5 w-3.5" />
                    </span>
                    Select Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={game} onValueChange={v => setGame(v ?? '')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="// Choose a game" />
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
              <p className="text-center text-sm" style={{ color: 'var(--text-mid)' }}>
                Select a game to see your key or generate a new one.
              </p>
            )}

            {game && keyLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-lo)' }} />
              </div>
            )}

            {game && !keyLoading && keyStatus && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="panel-icon"><KeyRound className="h-3.5 w-3.5" /></span>
                      Your Free Key
                    </CardTitle>
                    <span className="key-chip">{keyStatus.game}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="key-display flex-1 min-w-0">{keyStatus.key}</div>
                    <Button variant="default" size="icon-sm" onClick={() => handleCopy(keyStatus.key)} title="Copy key">
                      {copied === keyStatus.key ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  {(() => {
                    const dl = games.find(g => g.code === game)?.downloadLink;
                    return dl ? (
                      <a href={dl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">
                          <Download className="h-3.5 w-3.5 mr-1.5" /> Download Mod File
                        </Button>
                      </a>
                    ) : null;
                  })()}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--teal-2)' }}>
                      <div className="flex items-center justify-between">
                        <span className="metric-tile-label">Status</span>
                        <button onClick={() => void fetchMyKey(game)} disabled={statusLoading} className="opacity-60 hover:opacity-100 transition-opacity">
                          {statusLoading
                            ? <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--teal-2)' }} />
                            : <RefreshCw className="h-3 w-3" style={{ color: 'var(--teal-2)' }} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {keyStatus.isExpired || keyStatus.status === 0 ? <Activity className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} /> : keyStatus.isActivated ? <Activity className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} /> : <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />}
                        <span className="metric-tile-value" style={{ color: keyStatus.isExpired || keyStatus.status === 0 ? 'var(--red)' : keyStatus.isActivated ? 'var(--ecto-green)' : 'var(--gold)' }}>
                          {keyStatus.isExpired ? 'Expired' : keyStatus.isActivated ? 'Active' : 'Unused'}
                        </span>
                      </div>
                    </div>

                    <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--gold)' }}>
                      <span className="metric-tile-label">Devices</span>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" style={{ color: 'var(--text-lo)' }} />
                        <span className="metric-tile-value">{keyStatus.deviceCount} / 1</span>
                      </div>
                    </div>
                  </div>

                  <div className="metric-tile" style={{ ['--accent-color' as string]: keyStatus.isExpired ? 'var(--red)' : 'var(--teal-2)' }}>
                    <div className="flex items-center justify-between">
                      <span className="metric-tile-label">
                        {keyStatus.isActivated ? 'Time Remaining' : 'Grace Period Ends'}
                      </span>
                    </div>
                    <p className="font-mono text-2xl font-black tracking-wider" style={{ color: keyStatus.isExpired ? 'var(--red)' : 'var(--text-hi)' }}>
                      {keyStatus.isExpired ? 'Expired' : countdown}
                    </p>
                    {keyStatus.expiredDate && (
                      <p className="text-[10px] font-mono" style={{ color: 'var(--text-lo)' }}>
                        <Calendar className="inline h-2.5 w-2.5 mr-0.5" /> {formatDate(keyStatus.expiredDate)}
                      </p>
                    )}
                  </div>

                  <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--gold)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>Device Resets</p>
                          <p className="text-[10px] font-mono" style={{ color: 'var(--text-lo)' }}>{keyStatus.resetsRemaining} / 2 remaining</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" disabled={resetLoading || keyStatus.resetsRemaining === 0 || keyStatus.isExpired} onClick={handleResetDevices}>
                        {resetLoading
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <RefreshCw className="h-3 w-3" />}
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {game && !keyLoading && !hasActiveKey && games.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="panel-icon"><Zap className="h-3.5 w-3.5" /></span>
                    Generate New Key
                  </CardTitle>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-mid)' }}>
                    {keyStatus?.isExpired ? 'Your key has expired. Generate a new one below.' : 'No active key found. Generate one below.'}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <div className="duration-tile active">
                        <div className="flex flex-col items-center gap-0.5 w-full py-1">
                          <Timer className="h-5 w-5" style={{ color: 'var(--teal-2)' }} />
                          <span className="text-sm font-extrabold" style={{ color: 'var(--teal-3)' }}>3 Hours</span>
                          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-lo)' }}>With Ads</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC1YlrS074UQWwgz'}
                        onSuccess={setTurnstileToken}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={generating || !turnstileToken || !authUser}>
                      {generating
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                        : !authUser
                          ? <><LogIn className="h-3.5 w-3.5 mr-1.5" /> Sign in to Generate</>
                          : <><Zap className="h-3.5 w-3.5 mr-1.5" /> Unlock 3h Key (Watch Ads)</>
                      }
                    </Button>

                    <div className="text-center pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-[11px]" style={{ color: 'var(--text-mid)' }}>
                        {'Support our servers by visiting our '}
                        <a
                          href="https://www.effectivecpmnetwork.com/af3m3ncy4?key=d3dfc16b1bccb6cf90bb7c5871ecb083"
                          target="_blank" rel="noopener noreferrer"
                          className="font-bold hover:underline" style={{ color: 'var(--teal-2)' }}
                        >
                          Sponsor Link
                        </a>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {game && !keyLoading && hasActiveKey && (
              <p className="text-xs text-center font-mono" style={{ color: 'var(--text-lo)' }}>
                {'// come back after your key expires to generate a new one'}
              </p>
            )}

            {store && (
              <Card style={{ background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.05), transparent)', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
                <CardContent className="p-5 space-y-3 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'rgba(20, 184, 184, 0.1)' }}>
                    <ShoppingBag className="h-6 w-6" style={{ color: 'var(--teal-2)' }} />
                  </div>
                  <div>
                    <p className="font-display font-black tracking-wide" style={{ color: 'var(--text-hi)' }}>Want more time?</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-mid)' }}>Purchase premium keys with longer duration at our official shop.</p>
                  </div>
                  <Link href={`/${registrator}/store`} className="block">
                    <Button className="w-full">
                      <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Visit {store.storeName}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3 fade-up d1">
            {!authLoading && !authUser ? (
              <Card>
                <CardContent className="empty-state">
                  <div className="empty-icon-ring"><LogIn size={26} /></div>
                  <div className="empty-title">Sign In Required</div>
                  <div className="empty-sub">Sign in to view your key history.</div>
                  <Link href="/login">
                    <Button className="mt-3 gap-1.5">
                      <LogIn className="h-3.5 w-3.5" /> Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (<>
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--text-mid)' }}>
                <span className="font-mono" style={{ color: 'var(--text-lo)' }}>{'// '}</span>All keys generated from your IP
              </p>
              <Button variant="ghost" size="icon-sm" onClick={fetchHistory} disabled={historyLoading}>
                {historyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {historyLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-lo)' }} />
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <Card>
                <CardContent className="empty-state">
                  <div className="empty-icon-ring"><History size={26} /></div>
                  <div className="empty-title">No Key History</div>
                  <div className="empty-sub">No key history found.</div>
                </CardContent>
              </Card>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {history.map((entry, i) => (
                  <Card key={entry.key} className="p-0">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(20, 184, 184, 0.08)', color: 'var(--teal-3)', border: '1px solid rgba(20, 184, 184, 0.25)' }}>
                            #{history.length - i}
                          </span>
                          <span className="font-display font-bold text-sm truncate" style={{ color: 'var(--text-hi)' }}>{entry.game}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <HistoryStatusBadge entry={entry} />
                          {entry.isAdClaim
                            ? <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-widest" style={{ background: 'rgba(20, 184, 184, 0.08)', color: 'var(--teal-3)', border: '1px solid rgba(20, 184, 184, 0.25)' }}>With Ads</span>
                            : <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-widest" style={{ background: 'rgba(2, 6, 8, 0.5)', color: 'var(--text-lo)', border: '1px solid var(--border)' }}>No Ads</span>
                          }
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="key-display flex-1 min-w-0 text-xs">{entry.key}</div>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(entry.key)}>
                          {copied === entry.key ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--teal-2)' }}>
                          <span className="metric-tile-label"><Hash className="inline h-2.5 w-2.5 mr-0.5" /> Generated</span>
                          <span className="font-bold" style={{ color: 'var(--text-hi)' }}>{formatDate(entry.generatedAt)}</span>
                        </div>
                        <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--gold)' }}>
                          <span className="metric-tile-label"><Calendar className="inline h-2.5 w-2.5 mr-0.5" /> Expired</span>
                          <span className="font-bold" style={{ color: 'var(--text-hi)' }}>{formatDate(entry.expiredDate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--teal-2)' }}>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>Total keys generated:</span>
                  <span className="font-display font-bold text-sm" style={{ color: 'var(--text-hi)' }}>{history.length}</span>
                </div>
              </div>
            )}
            </>)}
          </div>
        )}

        {tab === 'downloads' && (
          <div className="space-y-3 fade-up d1">
            <p className="text-xs text-center" style={{ color: 'var(--text-mid)' }}>
              <span className="font-mono" style={{ color: 'var(--text-lo)' }}>{'// '}</span>Download the official mod files for your selected games.
            </p>

            {games.filter(g => g.downloadLink).length === 0 ? (
              <Card>
                <CardContent className="empty-state">
                  <div className="empty-icon-ring"><Download size={26} /></div>
                  <div className="empty-title">No Downloads</div>
                  <div className="empty-sub">No download links available.</div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {games.filter(g => g.downloadLink).map(g => (
                  <Card key={g.code}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--text-hi)' }}>{g.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-lo)' }}>{g.code}</p>
                      </div>
                      <a href={g.downloadLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                          <ExternalLink className="h-3 w-3 ml-1.5" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="callout-info">
              <ShieldAlert className="icon h-5 w-5" />
              <span>
                <strong>{'// '}</strong>Always download from these official links. We are not responsible for files downloaded from third-party sources.
              </span>
            </div>
          </div>
        )}

        {tab === 'top-users' && (
          <div className="space-y-3 fade-up d1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-black flex items-center gap-2" style={{ color: 'var(--text-hi)' }}>
                  <Trophy className="h-4 w-4" style={{ color: 'var(--gold)' }} /> Top Ad Supporters
                </h3>
                <p className="text-[10px] font-mono" style={{ color: 'var(--text-lo)' }}>{'// users claiming keys with ads'}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={fetchTopUsers} disabled={topUsersLoading}>
                {topUsersLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {topUsersLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-lo)' }} />
              </div>
            )}

            {!topUsersLoading && topUsers.length === 0 && (
              <Card>
                <CardContent className="empty-state">
                  <div className="empty-icon-ring"><Zap size={26} /></div>
                  <div className="empty-title">No Ad Claims</div>
                  <div className="empty-sub">No ad claims recorded yet.</div>
                </CardContent>
              </Card>
            )}

            {!topUsersLoading && topUsers.length > 0 && (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div
                    key={u.username}
                    className={i === 0 ? 'leader-row rank-1' : i === 1 ? 'leader-row rank-2' : i === 2 ? 'leader-row rank-3' : 'leader-row'}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={i === 0 ? 'rank-badge r1' : i === 1 ? 'rank-badge r2' : i === 2 ? 'rank-badge r3' : 'rank-badge r0'}>
                        {i === 0 ? <Trophy className="h-4 w-4" /> : `#${i + 1}`}
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-extrabold" style={{ color: 'var(--text-hi)' }}>@{u.username}</p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--text-lo)' }}>Last: {formatDate(u.lastClaim)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-black" style={{ color: 'var(--teal-2)' }}>{u.count}</p>
                      <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-lo)' }}>Claims</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="callout-info callout-ecto">
              <Cpu className="icon h-5 w-5" />
              <span>
                Supporting us by claiming keys with ads helps keep the service free. Top users get our special appreciation!
              </span>
            </div>
          </div>
        )}
      </main>

      <Script src="https://pl29635888.effectivecpmnetwork.com/76/e9/92/76e9921dd32b21981772bb0a3f32976a.js" strategy="afterInteractive" />
      <Script src="https://pl29635890.effectivecpmnetwork.com/df/d6/32/dfd632caec23bf46fbb7d22a48bead7d.js" strategy="lazyOnload" />

      <div className="max-w-lg mx-auto px-4 pb-6 flex flex-col items-center justify-center gap-2 relative z-10">
        <div id="container-11549e9ed33a224ea077baba528d1381" className="w-full min-h-[50px] flex items-center justify-center" />
      </div>
    </div>
  );
}
