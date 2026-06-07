'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, ChevronDown, ChevronUp, Copy, Megaphone, Gamepad2, Save, Link as LinkIcon, Settings as SettingsIcon, Wrench } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

interface GameSetting {
  _id: string;
  gameCode: string;
  gameName: string;
  isEnabled: boolean;
  connectEnabled: boolean;
  freeKeyEnabled: boolean;
  maintenanceMessage: string;
  downloadLink: string;
  modName: string;
  telegramChannel: string;
  telegramGroup: string;
  registrator: string;
  announcement: string;
  announcementStatus: string;
}

export default function GameSettingsPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameSetting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ gameCode: '', gameName: '' });
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [editGame, setEditGame] = useState<GameSetting | null>(null);

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

  if (!user) return <p className="text-muted-foreground">Please log in</p>;

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/game-settings');
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleAdd = async () => {
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

  const handleToggle = async (gameCode: string, field: string, value: boolean, registrator?: string) => {
    await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameCode, [field]: value, registrator }),
    });
    void fetchGames();
  };

  const handleDelete = async (gameCode: string, registrator?: string) => {
    if (!confirm(`Delete game ${gameCode}?`)) return;
    await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _method: 'DELETE', gameCode, registrator }),
    });
    toast.success('Game deleted');
    void fetchGames();
  };

  const handleSaveGame = async () => {
    if (!editGame) return;
    const res = await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameCode: editGame.gameCode,
        registrator: editGame.registrator,
        maintenanceMessage: editGame.maintenanceMessage,
        downloadLink: editGame.downloadLink,
        modName: editGame.modName,
        telegramChannel: editGame.telegramChannel,
        telegramGroup: editGame.telegramGroup,
        announcement: editGame.announcement,
        announcementStatus: editGame.announcementStatus,
      }),
    });
    if (res.ok) {
      toast.success('Game settings saved');
      setEditGame(null);
      void fetchGames();
    } else toast.error('Failed to save game settings');
  };

  const copyFreeKeyLink = (registrator: string) => {
    const url = `${window.location.origin}/${registrator}/free-key`;
    void navigator.clipboard.writeText(url);
    toast.success('Free key link copied');
  };

  const openEditGame = (game: GameSetting) => {
    setEditGame({ ...game });
    setExpandedGame(expandedGame === game._id ? null : game._id);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Game Catalogue"
        title="GAME"
        highlight="SETTINGS"
        sub="Configure per-game behaviour, features, downloads, and announcements."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Game</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Add Game</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Game Code</Label>
                  <Input value={form.gameCode} onChange={e => setForm({ ...form, gameCode: e.target.value.toUpperCase() })} placeholder="// e.g. CODM" />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Game Name</Label>
                  <Input value={form.gameName} onChange={e => setForm({ ...form, gameName: e.target.value })} placeholder="// e.g. Call of Duty Mobile" />
                </div>
                <Button onClick={handleAdd} className="w-full">Add Game</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {games.length === 0 ? (
        <Card>
          <CardContent className="empty-state">
            <div className="empty-icon-ring"><Gamepad2 size={26} /></div>
            <div className="empty-title">No Games Configured</div>
            <div className="empty-sub">Add a game to start managing features and keys.</div>
          </CardContent>
        </Card>
      ) : games.map(g => (
        <Card key={g._id} className="fade-up">
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="key-chip">{g.gameCode}</span>
                <CardTitle className="text-base">{g.gameName}</CardTitle>
                {g.registrator && (
                  <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
                    @{g.registrator}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex flex-wrap items-center gap-4 text-sm flex-1 lg:flex-none">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={g.isEnabled} onCheckedChange={v => void handleToggle(g.gameCode, 'isEnabled', v, g.registrator)} />
                    <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Enabled</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={g.connectEnabled} onCheckedChange={v => void handleToggle(g.gameCode, 'connectEnabled', v, g.registrator)} />
                    <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Connect</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={g.freeKeyEnabled} onCheckedChange={v => void handleToggle(g.gameCode, 'freeKeyEnabled', v, g.registrator)} />
                    <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Free Key</span>
                  </label>
                  <Button variant="outline" size="sm" onClick={() => copyFreeKeyLink(g.registrator)}>
                    <Copy className="h-3 w-3" /> Free Key Link
                  </Button>
                </div>
                <div className="flex items-center gap-1 ml-auto lg:ml-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditGame(g)} title={expandedGame === g._id ? 'Collapse' : 'Expand'}>
                    {expandedGame === g._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => void handleDelete(g.gameCode, g.registrator)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          {expandedGame === g._id && editGame && editGame._id === g._id && (
            <CardContent className="space-y-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                  <Wrench className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Maintenance Message
                </Label>
                <Input value={editGame.maintenanceMessage || ''} onChange={e => setEditGame({ ...editGame, maintenanceMessage: e.target.value })} placeholder="// Game-specific maintenance message" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                  <LinkIcon className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Download Link
                </Label>
                <Input value={editGame.downloadLink || ''} onChange={e => setEditGame({ ...editGame, downloadLink: e.target.value })} placeholder="// Mod download URL" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                  <SettingsIcon className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Mod Name
                </Label>
                <Input value={editGame.modName || ''} onChange={e => setEditGame({ ...editGame, modName: e.target.value })} placeholder="// e.g. Winter Mod" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Telegram Channel</Label>
                  <Input value={editGame.telegramChannel || ''} onChange={e => setEditGame({ ...editGame, telegramChannel: e.target.value })} placeholder="https://t.me/channel" />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Telegram Group</Label>
                  <Input value={editGame.telegramGroup || ''} onChange={e => setEditGame({ ...editGame, telegramGroup: e.target.value })} placeholder="https://t.me/group" />
                </div>
              </div>
              <div className="space-y-4 border-t pt-4 mt-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-hi)' }}>
                  <Megaphone className="h-4 w-4" style={{ color: 'var(--teal-2)' }} /> Announcement
                </div>
                <p className="font-mono text-[10px]" style={{ color: 'var(--text-lo)' }}>
                  {'// shown after login. fetched from '}
                  <code style={{ background: 'rgba(20, 184, 184, 0.1)', padding: '0.05rem 0.3rem', borderRadius: 3, color: 'var(--teal-3)' }}>/{editGame.registrator}/announcement</code>
                </p>
                <div className="flex items-center gap-3">
                  <Switch checked={editGame.announcementStatus === 'on'} onCheckedChange={v => setEditGame({ ...editGame, announcementStatus: v ? 'on' : 'off' })} />
                  <Label className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>Show Announcement</Label>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>Announcement Message</Label>
                  <Textarea value={editGame.announcement || ''} onChange={e => setEditGame({ ...editGame, announcement: e.target.value })} placeholder="// Enter announcement text…" className="text-xs min-h-[60px]" />
                </div>
              </div>

              <Button onClick={handleSaveGame} size="sm">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Game Settings
              </Button>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
