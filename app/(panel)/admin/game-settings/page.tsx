'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Copy, Gamepad2, KeyRound, Power, RadioTower, Info } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GameSetting {
  _id: string;
  gameCode: string;
  gameName: string;
  isEnabled: boolean;
  connectEnabled: boolean;
  freeKeyEnabled: boolean;
  registrator: string;
}

type ChannelField = 'isEnabled' | 'connectEnabled' | 'freeKeyEnabled';

export default function GameSettingsPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameSetting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ gameCode: '', gameName: '' });
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await fetch('/api/game-settings');
        const data = await res.json();
        setGames(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Authenticating…
        </p>
      </div>
    );
  }

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/game-settings');
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleAdd = async () => {
    if (!form.gameCode.trim() || !form.gameName.trim()) {
      toast.error('Game code and name are required');
      return;
    }
    const res = await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Game added');
      setDialogOpen(false);
      setForm({ gameCode: '', gameName: '' });
      void fetchGames();
    } else toast.error('Failed to add game');
  };

  /**
   * Toggles save immediately. We update the row optimistically so the switch
   * never snaps back while the request is in flight, and roll back on failure.
   */
  const handleToggle = async (game: GameSetting, field: ChannelField, value: boolean) => {
    const key = `${game._id}:${field}`;
    const previous = games;

    setPending((p) => ({ ...p, [key]: true }));
    setGames((prev) => prev.map((g) => (g._id === game._id ? { ...g, [field]: value } : g)));

    try {
      const res = await fetch('/api/game-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode: game.gameCode,
          [field]: value,
          registrator: game.registrator,
        }),
      });
      if (!res.ok) throw new Error('request failed');
    } catch {
      setGames(previous);
      toast.error('Channel update failed — change reverted');
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  const handleDelete = async (gameCode: string, registrator?: string) => {
    if (!confirm(`Delete the ${gameCode} configuration? Keys already issued stay valid.`)) return;
    await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _method: 'DELETE', gameCode, registrator }),
    });
    toast.success('Game deleted');
    void fetchGames();
  };

  const copyFreeKeyLink = (registrator: string) => {
    if (!registrator) {
      toast.error('This game has no registrator, so it has no public link');
      return;
    }
    const url = `${window.location.origin}/${registrator}/free-key`;
    void navigator.clipboard.writeText(url);
    toast.success('Free key link copied');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="[ GAME CATALOGUE ]"
        title="Game"
        highlight="Settings"
        sub="Each game exposes three channels. The master switch gates the other two."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus aria-hidden /> Add game
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add game</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="field">
                  <Label className="field-label" htmlFor="new-game-code">
                    Game code
                  </Label>
                  <Input
                    id="new-game-code"
                    value={form.gameCode}
                    onChange={(e) => setForm({ ...form, gameCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. CODM"
                    className="font-mono uppercase"
                  />
                  <p className="field-hint">Short identifier used by the mod client.</p>
                </div>
                <div className="field">
                  <Label className="field-label" htmlFor="new-game-name">
                    Game name
                  </Label>
                  <Input
                    id="new-game-name"
                    value={form.gameName}
                    onChange={(e) => setForm({ ...form, gameName: e.target.value })}
                    placeholder="e.g. Call of Duty Mobile"
                  />
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Add game
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {games.length === 0 ? (
        <Card>
          <CardContent className="empty-state">
            <div className="empty-icon-ring">
              <Gamepad2 aria-hidden className="size-6" />
            </div>
            <p className="empty-title">No games configured</p>
            <p className="empty-sub">Add a game to start managing features and keys.</p>
          </CardContent>
        </Card>
      ) : (
        games.map((g) => {
          const busy = (field: ChannelField) => Boolean(pending[`${g._id}:${field}`]);

          return (
            <Card key={g._id} className="fade-up">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="key-chip">{g.gameCode}</span>
                  <CardTitle className="text-base">{g.gameName}</CardTitle>
                  {g.registrator && (
                    <span className="font-mono text-xs text-muted-foreground">
                      @{g.registrator}
                    </span>
                  )}

                  <span
                    className={cn(
                      'ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em]',
                      g.isEnabled
                        ? 'border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] text-[var(--green-soft)]'
                        : 'border-border bg-white/[0.03] text-muted-foreground'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 rounded-full',
                        g.isEnabled ? 'bg-[var(--ecto-green)]' : 'bg-[var(--text-lo)]'
                      )}
                    />
                    {g.isEnabled ? 'Live' : 'Paused'}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleDelete(g.gameCode, g.registrator)}
                    aria-label={`Delete ${g.gameCode}`}
                    className="text-[var(--red)] hover:bg-[rgba(239,68,68,0.12)] hover:text-[var(--red-soft)]"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <ChannelTile
                    icon={Power}
                    title="Game enabled"
                    description="Master switch. Listed in downloads and server status."
                    checked={g.isEnabled}
                    busy={busy('isEnabled')}
                    onCheckedChange={(v) => void handleToggle(g, 'isEnabled', v)}
                  />
                  <ChannelTile
                    icon={RadioTower}
                    title="Mod connect"
                    description="Accept key logins through the mod client."
                    checked={g.connectEnabled}
                    busy={busy('connectEnabled')}
                    onCheckedChange={(v) => void handleToggle(g, 'connectEnabled', v)}
                    lockedBy={!g.isEnabled ? 'Turn on Game enabled first' : undefined}
                  />
                  <ChannelTile
                    icon={KeyRound}
                    title="Free key"
                    description="Allow visitors to claim a 3-hour trial key."
                    checked={g.freeKeyEnabled}
                    busy={busy('freeKeyEnabled')}
                    onCheckedChange={(v) => void handleToggle(g, 'freeKeyEnabled', v)}
                    lockedBy={!g.isEnabled ? 'Turn on Game enabled first' : undefined}
                    footer={
                      g.registrator ? (
                        <button
                          type="button"
                          onClick={() => copyFreeKeyLink(g.registrator)}
                          className="mt-1.5 inline-flex cursor-pointer items-center gap-1 font-mono text-[0.65rem] text-[var(--brand-300)] transition-colors hover:text-[var(--brand-400)] hover:underline"
                        >
                          <Copy aria-hidden className="size-3" />
                          /{g.registrator}/free-key
                        </button>
                      ) : null
                    }
                  />
                </div>

                <p className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted-foreground">
                  <Info aria-hidden className="size-3" />
                  Channel changes save instantly
                </p>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

interface ChannelTileProps {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  description: string;
  checked: boolean;
  busy?: boolean;
  lockedBy?: string;
  onCheckedChange: (checked: boolean) => void;
  footer?: ReactNode;
}

function ChannelTile({
  icon: Icon,
  title,
  description,
  checked,
  busy,
  lockedBy,
  onCheckedChange,
  footer,
}: ChannelTileProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 transition-colors duration-200',
        checked
          ? 'border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.055)]'
          : 'border-border bg-[var(--bg-inset)]',
        busy && 'opacity-70'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            aria-hidden
            className={cn('size-3.5 shrink-0', checked ? 'text-[var(--ecto-green)]' : 'text-[var(--text-lo)]')}
          />
          <span className="truncate text-[0.8rem] font-semibold text-foreground">{title}</span>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={Boolean(lockedBy) || busy}
          aria-label={title}
          className="mt-0.5"
        />
      </div>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{description}</p>
      {lockedBy ? (
        <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-[var(--gold-soft)]">
          {lockedBy}
        </p>
      ) : (
        footer
      )}
    </div>
  );
}
