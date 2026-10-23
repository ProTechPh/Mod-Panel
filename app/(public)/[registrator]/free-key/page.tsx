'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  Cpu,
  ExternalLink,
  Gamepad2,
  Hash,
  History,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ADSTERRA_SMARTLINK_URL,
  AdsterraBanner,
  AdsterraNativeBanner,
  AdsterraPageScripts,
} from '@/components/ads/AdsterraAds';

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
  username: string;
  count: number;
  lastClaim: string;
}

type Tab = 'key' | 'history' | 'top-users';

const TABS: { id: Tab; label: string; shortLabel: string; Icon: typeof KeyRound }[] = [
  { id: 'key', label: 'My Key', shortLabel: 'Key', Icon: KeyRound },
  { id: 'history', label: 'History', shortLabel: 'History', Icon: History },
  { id: 'top-users', label: 'Top Users', shortLabel: 'Top', Icon: Trophy },
];

function formatCountdown(targetIso: string | null): string {
  if (!targetIso) return 'Not started';
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Not available';
  return new Date(iso).toLocaleString();
}

function HistoryStatusBadge({ entry }: { entry: KeyHistoryEntry }) {
  if (entry.status === 0) return <StatusBadge status="blocked">Suspended</StatusBadge>;
  if (entry.isExpired) return <StatusBadge status="expired">Expired</StatusBadge>;
  if (entry.isActivated) return <StatusBadge status="active" withDot>Active</StatusBadge>;
  return <StatusBadge status="warning">Unused</StatusBadge>;
}

function LoadingScreen() {
  return (
    <div className="state-screen">
      <Loader2 className="size-8 animate-spin text-[var(--brand-500)]" aria-label="Loading free key page" />
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, description }: {
  icon: typeof KeyRound;
  title: string;
  description: string;
}) {
  return (
    <div className="panel panel--flat">
      <div className="empty-state flex flex-col items-center justify-center p-7 text-center">
        <div className="empty-icon-ring"><Icon size={24} aria-hidden /></div>
        <p className="empty-title">{title}</p>
        <p className="empty-sub">{description}</p>
      </div>
    </div>
  );
}

export default function FreeKeyPage() {
  const { registrator } = useParams<{ registrator: string }>();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <FreeKeyContent registrator={registrator} />
    </Suspense>
  );
}

function FreeKeyContent({ registrator }: { registrator: string }) {
  const searchParams = useSearchParams();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [game, setGame] = useState(searchParams.get('game') || '');
  const [tab, setTab] = useState<Tab>('key');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const sponsorToken = searchParams.get('sponsorToken');
  const sponsorStageParam = Number(searchParams.get('sponsorStage'));
  const sponsorStage = sponsorStageParam === 1 || sponsorStageParam === 2 ? sponsorStageParam : null;
  const [sponsorVisited, setSponsorVisited] = useState(false);
  const [sponsorCountdown, setSponsorCountdown] = useState(8);
  const [advancingSponsor, setAdvancingSponsor] = useState(false);
  const [showLeaderboardAd, setShowLeaderboardAd] = useState(false);

  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topUsersLoading, setTopUsersLoading] = useState(false);
  const keyRequestIdRef = useRef(0);

  const fetchMyKey = useCallback(async (selectedGame: string, silent = false) => {
    if (!selectedGame) return;
    const requestId = ++keyRequestIdRef.current;
    if (!silent) setStatusLoading(true);
    setKeyLoading(true);

    try {
      const response = await fetch(
        `/api/free-key/my-key?registrator=${encodeURIComponent(registrator)}&game=${encodeURIComponent(selectedGame)}`,
      );
      const data = await response.json();
      if (requestId !== keyRequestIdRef.current) return;
      const nextStatus = response.ok ? data as KeyStatus : null;
      setKeyStatus(nextStatus);
      setCountdown(formatCountdown(nextStatus?.expiredDate ?? null));
    } catch {
      if (requestId !== keyRequestIdRef.current) return;
      setKeyStatus(null);
      if (!silent) toast.error('Unable to refresh your key');
    } finally {
      if (requestId === keyRequestIdRef.current) {
        setStatusLoading(false);
        setKeyLoading(false);
      }
    }
  }, [registrator]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/free-key/history?registrator=${encodeURIComponent(registrator)}`);
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
      toast.error('Unable to load key history');
    } finally {
      setHistoryLoading(false);
    }
  }, [registrator]);

  const fetchTopUsers = useCallback(async () => {
    setTopUsersLoading(true);
    try {
      const response = await fetch(`/api/free-key/top-users?registrator=${encodeURIComponent(registrator)}&limit=10`);
      const data = await response.json();
      setTopUsers(Array.isArray(data) ? data : []);
    } catch {
      setTopUsers([]);
      toast.error('Unable to load the leaderboard');
    } finally {
      setTopUsersLoading(false);
    }
  }, [registrator]);

  useEffect(() => {
    void (async () => {
      setGamesLoading(true);
      try {
        const response = await fetch(`/api/free-key/games?registrator=${encodeURIComponent(registrator)}`);
        const data = await response.json();
        const list: GameOption[] = Array.isArray(data) ? data : [];
        setGames(list);

        const requestedGame = searchParams.get('game');
        const selectedGame = requestedGame && list.some(item => item.code === requestedGame)
          ? requestedGame
          : list.length === 1
            ? list[0].code
            : '';

        if (selectedGame) {
          setGame(selectedGame);
          await fetchMyKey(selectedGame, true);
        } else if (requestedGame) {
          setGame('');
        }
      } catch {
        setGames([]);
        toast.error('Unable to load available games');
      } finally {
        setGamesLoading(false);
      }
    })();

    const claimToken = searchParams.get('claimToken');
    if (!claimToken) return;

    void (async () => {
      setClaiming(true);
      try {
        const response = await fetch('/api/free-key/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: claimToken }),
        });
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || 'Failed to claim key');
          return;
        }

        toast.success('Key claimed successfully');
        setGame(data.game);
        await fetchMyKey(data.game, true);
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        toast.error('Unable to claim the key');
      } finally {
        setClaiming(false);
      }
    })();
  }, [registrator, searchParams, fetchMyKey]);

  useEffect(() => {
    if (!keyStatus?.expiredDate) return;

    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(keyStatus.expiredDate));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [keyStatus?.expiredDate]);

  useEffect(() => {
    if (!sponsorVisited || sponsorCountdown <= 0) return;
    const timeout = window.setTimeout(() => {
      setSponsorCountdown(current => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [sponsorVisited, sponsorCountdown]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateLeaderboardVisibility = () => setShowLeaderboardAd(mediaQuery.matches);
    updateLeaderboardVisibility();
    mediaQuery.addEventListener('change', updateLeaderboardVisibility);
    return () => mediaQuery.removeEventListener('change', updateLeaderboardVisibility);
  }, []);

  useEffect(() => {
    const container = document.getElementById('container-11549e9ed33a224ea077baba528d1381');
    if (!container || container.hasChildNodes()) return;

    const script = document.createElement('script');
    script.src = 'https://pl29635891.effectivecpmnetwork.com/11549e9ed33a224ea077baba528d1381/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    container.appendChild(script);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!game) {
      toast.error('Select a game first');
      return;
    }
    if (siteKey && !turnstileToken) {
      toast.error('Complete the security check');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/free-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game,
          turnstileToken: turnstileToken || undefined,
          registrator,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to generate key');
        return;
      }
      if (!data.sponsorUrl) {
        toast.error('The sponsor stages are unavailable. Please try again later.');
        return;
      }

      toast.success('Sponsor stages ready. Redirecting...');
      window.setTimeout(() => { window.location.href = data.sponsorUrl; }, 800);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setGenerating(false);
      setTurnstileToken('');
    }
  };

  const handleSponsorContinue = async () => {
    if (!sponsorToken || !sponsorStage || !sponsorVisited || sponsorCountdown > 0) return;
    setAdvancingSponsor(true);
    try {
      const response = await fetch('/api/free-key/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sponsorToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Unable to complete sponsor stage');
        return;
      }

      const destination = data.nextUrl || data.adUrl;
      if (!destination) {
        toast.error('The next sponsor stage is unavailable. Please try again.');
        return;
      }
      window.location.href = destination;
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setAdvancingSponsor(false);
    }
  };

  const handleCopy = async (keyValue: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(keyValue);
      toast.success('Key copied');
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Unable to copy the key');
    }
  };

  const handleResetDevices = async () => {
    if (!keyStatus?.key) return;
    setResetLoading(true);
    try {
      const response = await fetch('/api/free-key/reset-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyStatus.key }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to reset devices');
        return;
      }

      toast.success(`Devices reset. ${data.resetsRemaining} reset(s) remaining.`);
      await fetchMyKey(game, true);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGameChange = (nextGame: string | null) => {
    const selectedGame = nextGame ?? '';
    keyRequestIdRef.current += 1;
    setGame(selectedGame);
    setKeyStatus(null);
    setCountdown('');
    setKeyLoading(false);
    setStatusLoading(false);
    if (selectedGame) void fetchMyKey(selectedGame, true);
  };

  const handleTabChange = (nextTab: Tab) => {
    setTab(nextTab);
    if (nextTab === 'history') void fetchHistory();
    if (nextTab === 'top-users') void fetchTopUsers();
  };

  const hasActiveKey = Boolean(keyStatus && !keyStatus.isExpired && keyStatus.status === 1);
  const canGenerateKey = !keyStatus || keyStatus.isExpired;
  const keyState = keyStatus?.status === 0
    ? { label: 'Suspended', color: 'var(--red)', Icon: ShieldAlert }
    : keyStatus?.isExpired
      ? { label: 'Expired', color: 'var(--red)', Icon: AlertTriangle }
      : keyStatus?.isActivated
        ? { label: 'Active', color: 'var(--ecto-green)', Icon: Activity }
        : { label: 'Unused', color: 'var(--gold)', Icon: AlertTriangle };

  if (sponsorToken && sponsorStage) {
    return (
      <div className="relative min-h-screen bg-[var(--bg-void)]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-20 size-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.08)_0%,transparent_68%)] blur-3xl" />
        </div>
        <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-5 px-4 py-8">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand-300)]">Adsterra sponsor</p>
            <h1 className="mt-2 font-display text-3xl font-black text-[var(--text-hi)]">Sponsor stage {sponsorStage} of 2</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-mid)]">Visit the sponsor in a new tab, then return here to continue.</p>
          </div>

          <div className="panel panel--flat overflow-hidden">
            <div className="panel-head">
              <div className="panel-title"><Zap className="ico size-3.5" aria-hidden /> Required sponsor visit</div>
              <span className="panel-badge">{sponsorStage}/2</span>
            </div>
            <div className="space-y-4 p-4">
              {showLeaderboardAd && (
                <AdsterraBanner
                  placementKey="4e1da0ced89b07aa5637ad0458f7ec7f"
                  width={728}
                  height={90}
                  title={`Sponsor stage ${sponsorStage} leaderboard advertisement`}
                  className="mx-auto flex w-[728px] max-w-full justify-center overflow-hidden"
                />
              )}

              <AdsterraBanner
                placementKey="007a11a9ae6a1bad6dbf766f5b10b1e4"
                width={300}
                height={250}
                title={`Sponsor stage ${sponsorStage} advertisement`}
                className="mx-auto flex w-[300px] max-w-full justify-center overflow-hidden"
              />

              <a
                href={ADSTERRA_SMARTLINK_URL}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() => setSponsorVisited(true)}
                className="focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-600)] px-4 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-[var(--brand-500)]"
              >
                Visit Adsterra sponsor <ExternalLink className="size-4" aria-hidden />
              </a>

              <AdsterraNativeBanner />

              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full"
                disabled={!sponsorVisited || sponsorCountdown > 0 || advancingSponsor}
                onClick={handleSponsorContinue}
              >
                {advancingSponsor ? (
                  <><Loader2 className="animate-spin" aria-hidden /> Verifying stage...</>
                ) : !sponsorVisited ? (
                  'Visit sponsor to continue'
                ) : sponsorCountdown > 0 ? (
                  `Continue in ${sponsorCountdown}s`
                ) : sponsorStage === 1 ? (
                  'Continue to Stage 2'
                ) : (
                  'Continue to ReShortFly'
                )}
              </Button>
              <p className="text-center font-mono text-[10px] leading-5 text-[var(--text-lo)]">Do not close this tab. The final ReShortFly step returns you here to claim the key.</p>
            </div>
          </div>
        </main>
        <AdsterraPageScripts />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-void)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-20 size-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.06)_0%,transparent_68%)] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      </div>

      {claiming && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center backdrop-blur-md" role="status" aria-live="polite">
          <Loader2 className="size-11 animate-spin text-[var(--brand-500)]" aria-hidden />
          <div>
            <p className="font-display text-lg font-bold text-[var(--text-hi)]">Verifying your claim</p>
            <p className="mt-1 text-sm text-[var(--text-mid)]">Please keep this page open.</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(7,8,10,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-orange-500/25 bg-orange-500/10">
              <KeyRound className="size-4 text-[var(--brand-500)]" aria-hidden />
            </span>
            <div className="leading-tight">
              <span className="block font-display text-sm font-bold text-[var(--text-hi)]">Free Key</span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-lo)]">{registrator}</span>
            </div>
          </div>
          <StatusBadge status="online" withDot>Service online</StatusBadge>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl space-y-5 px-4 py-6 md:py-9">
        <section className="space-y-4 text-center" aria-labelledby="free-key-title">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-orange-500/25 bg-orange-500/10 shadow-[0_0_32px_rgba(234,88,12,0.12)]">
            <KeyRound className="size-8 text-[var(--brand-500)]" aria-hidden />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand-300)]">3-hour trial access</p>
            <h1 id="free-key-title" className="font-display text-3xl font-black tracking-tight text-[var(--text-hi)] sm:text-4xl">
              Get your free key
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-mid)]">
              Choose a game, complete the security check, then visit the sponsor page to unlock your key.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="status-pill-active"><Sparkles className="size-3" aria-hidden /> Free trial</span>
            <span className="status-pill-warning"><Timer className="size-3" aria-hidden /> 3 hours</span>
            <span className="status-pill-gold"><ShieldCheck className="size-3" aria-hidden /> One device</span>
          </div>
        </section>

        <nav className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-black/25 p-1" aria-label="Free key sections" role="tablist">
          {TABS.map(({ id, label, shortLabel, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`tabpanel-${id}`}
              id={`tab-${id}`}
              onClick={() => handleTabChange(id)}
              className={tab === id ? 'tab-btn active focus-ring' : 'tab-btn focus-ring'}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        {tab === 'key' && (
          <section id="tabpanel-key" role="tabpanel" aria-labelledby="tab-key" className="space-y-4 fade-up d1">
            {gamesLoading ? (
              <div className="flex justify-center py-12" role="status">
                <Loader2 className="size-6 animate-spin text-[var(--text-lo)]" aria-label="Loading games" />
              </div>
            ) : games.length === 0 ? (
              <EmptyPanel icon={Gamepad2} title="Free keys unavailable" description="This operator has no free-key channels enabled right now." />
            ) : (
              <div className="panel panel--flat">
                <div className="panel-head">
                  <div className="panel-title"><Gamepad2 className="ico size-3.5" aria-hidden /> Choose a game</div>
                  <span className="panel-badge">Step 1</span>
                </div>
                <div className="p-4">
                  <label htmlFor="free-key-game" className="field-label mb-2 block">Available game</label>
                  <Select value={game} onValueChange={handleGameChange}>
                    <SelectTrigger id="free-key-game" className="w-full">
                      <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map(item => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {!game && games.length > 0 && !gamesLoading && (
              <div className="callout-info">
                <Gamepad2 className="icon size-5 shrink-0" aria-hidden />
                <span>Select a game above to view an existing key or generate a new one.</span>
              </div>
            )}

            {game && keyLoading && (
              <div className="flex justify-center py-10" role="status">
                <Loader2 className="size-6 animate-spin text-[var(--text-lo)]" aria-label="Checking for an existing key" />
              </div>
            )}

            {game && !keyLoading && keyStatus && (
              <div className="panel panel--flat">
                <div className="panel-head">
                  <div className="panel-title"><KeyRound className="ico size-3.5" aria-hidden /> Current key</div>
                  <StatusBadge status={keyStatus.status === 0 ? 'blocked' : keyStatus.isExpired ? 'expired' : keyStatus.isActivated ? 'active' : 'warning'} withDot>
                    {keyState.label}
                  </StatusBadge>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <span className="field-label mb-2 block">License key</span>
                    <div className="flex items-center gap-2">
                      <code className="key-display min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{keyStatus.key}</code>
                      <Button variant="outline" size="icon" onClick={() => void handleCopy(keyStatus.key)} aria-label="Copy license key">
                        {copied === keyStatus.key ? <Check className="text-[var(--ecto-green)]" aria-hidden /> : <Copy aria-hidden />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="metric-tile" style={{ ['--accent-color' as string]: keyState.color }}>
                      <span className="metric-tile-label">Status</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-bold" style={{ color: keyState.color }}>
                          <keyState.Icon className="size-3.5" aria-hidden /> {keyState.label}
                        </span>
                        <button type="button" onClick={() => void fetchMyKey(game)} disabled={statusLoading} className="focus-ring cursor-pointer rounded p-1 text-[var(--text-lo)] transition-colors hover:text-[var(--brand-500)]" aria-label="Refresh key status">
                          <RefreshCw className={statusLoading ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--gold)' }}>
                      <span className="metric-tile-label">Devices</span>
                      <span className="flex items-center gap-2 font-bold text-[var(--text-hi)]">
                        <Smartphone className="size-4 text-[var(--text-lo)]" aria-hidden /> {keyStatus.deviceCount} / 1
                      </span>
                    </div>
                  </div>

                  <div className="metric-tile" style={{ ['--accent-color' as string]: keyStatus.isExpired ? 'var(--red)' : 'var(--brand-500)' }}>
                    <span className="metric-tile-label">{keyStatus.isActivated ? 'Time remaining' : 'Activation window'}</span>
                    <span className="font-mono text-2xl font-black tracking-wide text-[var(--text-hi)]">{keyStatus.isExpired ? 'Expired' : countdown}</span>
                    {keyStatus.expiredDate && (
                      <span className="font-mono text-[10px] text-[var(--text-lo)]"><Calendar className="mr-1 inline size-3" aria-hidden />{formatDate(keyStatus.expiredDate)}</span>
                    )}
                  </div>

                  <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--gold)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <ShieldAlert className="size-4 shrink-0 text-[var(--gold)]" aria-hidden />
                        <div>
                          <p className="text-xs font-bold text-[var(--text-hi)]">Device reset</p>
                          <p className="font-mono text-[10px] text-[var(--text-lo)]">{keyStatus.resetsRemaining} of 2 remaining</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" disabled={resetLoading || keyStatus.status !== 1 || keyStatus.deviceCount === 0 || keyStatus.resetsRemaining === 0 || keyStatus.isExpired} onClick={handleResetDevices}>
                        {resetLoading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {game && !keyLoading && canGenerateKey && games.length > 0 && (
              <div className="panel panel--flat">
                <div className="panel-head">
                  <div className="panel-title"><Zap className="ico size-3.5" aria-hidden /> Unlock a new key</div>
                  <span className="panel-badge">Step 2</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                  <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.06] p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-[var(--brand-500)]"><Timer className="size-5" aria-hidden /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--text-hi)]">3-hour free key</p>
                        <p className="text-xs leading-5 text-[var(--text-mid)]">One device · 2 Adsterra stages + 1 ReShortFly</p>
                      </div>
                      <StatusBadge status="info">Free</StatusBadge>
                    </div>
                  </div>

                  {siteKey && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="field-label">Security check</span>
                      <div className="max-w-full overflow-hidden rounded-lg">
                        <Turnstile
                          siteKey={siteKey}
                          onSuccess={setTurnstileToken}
                          onExpire={() => setTurnstileToken('')}
                          onError={() => {
                            setTurnstileToken('');
                            toast.error('Security check failed. Please try again.');
                          }}
                          options={{ theme: 'dark' }}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={generating || (!!siteKey && !turnstileToken)}>
                    {generating ? <><Loader2 className="animate-spin" aria-hidden /> Preparing sponsor link...</> : <><Zap aria-hidden /> Continue to sponsor</>}
                  </Button>
                  <p className="text-center text-[11px] leading-5 text-[var(--text-lo)]">Complete 2 Adsterra stages and 1 ReShortFly step. ReShortFly will return you here automatically to claim your key.</p>
                </form>
              </div>
            )}

            {game && !keyLoading && hasActiveKey && (
              <p className="text-center font-mono text-[11px] text-[var(--text-lo)]">You can generate another key after the current one expires.</p>
            )}

            {game && !keyLoading && keyStatus?.status === 0 && !keyStatus.isExpired && (
              <div className="callout-info border-red-500/20 bg-red-500/[0.06] text-[var(--red-soft)]">
                <ShieldAlert className="icon size-5 shrink-0" aria-hidden />
                <span>This key is suspended. Contact the operator before requesting another key.</span>
              </div>
            )}
          </section>
        )}

        {tab === 'history' && (
          <section id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history" className="space-y-4 fade-up d1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--text-hi)]">Key history</h2>
                <p className="text-xs text-[var(--text-mid)]">Keys previously claimed through this operator.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchHistory} disabled={historyLoading} aria-label="Refresh key history">
                <RefreshCw className={historyLoading ? 'animate-spin' : ''} aria-hidden />
              </Button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-12" role="status"><Loader2 className="size-6 animate-spin text-[var(--text-lo)]" aria-label="Loading key history" /></div>
            ) : history.length === 0 ? (
              <EmptyPanel icon={History} title="No key history" description="Your claimed keys will appear here." />
            ) : (
              <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {history.map((entry, index) => (
                  <article key={entry.key} className="panel panel--flat">
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold text-[var(--text-hi)]">{entry.game}</p>
                          <p className="font-mono text-[10px] text-[var(--text-lo)]">Claim #{history.length - index}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <HistoryStatusBadge entry={entry} />
                          {entry.isAdClaim && <StatusBadge status="info">Sponsor</StatusBadge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="key-display min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs">{entry.key}</code>
                        <Button variant="ghost" size="icon" onClick={() => void handleCopy(entry.key)} aria-label="Copy historical key">
                          {copied === entry.key ? <Check className="text-[var(--ecto-green)]" aria-hidden /> : <Copy aria-hidden />}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--brand-500)' }}>
                          <span className="metric-tile-label"><Hash className="mr-1 inline size-3" aria-hidden />Generated</span>
                          <span className="font-semibold text-[var(--text-hi)]">{formatDate(entry.generatedAt)}</span>
                        </div>
                        <div className="metric-tile" style={{ ['--accent-color' as string]: 'var(--gold)' }}>
                          <span className="metric-tile-label"><Calendar className="mr-1 inline size-3" aria-hidden />Expires</span>
                          <span className="font-semibold text-[var(--text-hi)]">{formatDate(entry.expiredDate)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'top-users' && (
          <section id="tabpanel-top-users" role="tabpanel" aria-labelledby="tab-top-users" className="space-y-4 fade-up d1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-[var(--text-hi)]"><Trophy className="size-4 text-[var(--gold)]" aria-hidden /> Top supporters</h2>
                <p className="text-xs text-[var(--text-mid)]">Users with the most sponsor-backed claims.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchTopUsers} disabled={topUsersLoading} aria-label="Refresh leaderboard">
                <RefreshCw className={topUsersLoading ? 'animate-spin' : ''} aria-hidden />
              </Button>
            </div>

            {topUsersLoading ? (
              <div className="flex justify-center py-12" role="status"><Loader2 className="size-6 animate-spin text-[var(--text-lo)]" aria-label="Loading leaderboard" /></div>
            ) : topUsers.length === 0 ? (
              <EmptyPanel icon={Trophy} title="No supporters yet" description="The leaderboard will update after the first sponsor-backed claim." />
            ) : (
              <div className="space-y-2">
                {topUsers.map((user, index) => (
                  <div key={user.username} className={index === 0 ? 'leader-row rank-1' : index === 1 ? 'leader-row rank-2' : index === 2 ? 'leader-row rank-3' : 'leader-row'}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={index === 0 ? 'rank-badge r1' : index === 1 ? 'rank-badge r2' : index === 2 ? 'rank-badge r3' : 'rank-badge r0'}>
                        {index === 0 ? <Trophy className="size-4" aria-hidden /> : `#${index + 1}`}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-extrabold text-[var(--text-hi)]">@{user.username}</p>
                        <p className="font-mono text-[10px] text-[var(--text-lo)]">Last claim: {formatDate(user.lastClaim)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-black text-[var(--brand-500)]">{user.count}</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-lo)]">Claims</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="callout-info callout-ecto">
              <Cpu className="icon size-5 shrink-0" aria-hidden />
              <span>Sponsor-backed claims help keep the free-key service online.</span>
            </div>
          </section>
        )}
      </main>

      <Script src="https://pl29635888.effectivecpmnetwork.com/76/e9/92/76e9921dd32b21981772bb0a3f32976a.js" strategy="afterInteractive" />
      <Script src="https://pl29635890.effectivecpmnetwork.com/df/d6/32/dfd632caec23bf46fbb7d22a48bead7d.js" strategy="lazyOnload" />
      <div className="relative z-10 mx-auto flex max-w-2xl items-center justify-center px-4 pb-6">
        <div id="container-11549e9ed33a224ea077baba528d1381" className="flex min-h-[50px] w-full items-center justify-center" />
      </div>
    </div>
  );
}
