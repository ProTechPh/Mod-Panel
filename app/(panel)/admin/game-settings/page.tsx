'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, ChevronDown, ChevronUp, Copy, Megaphone, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';

interface GameSetting {
  _id: string;
  gameCode: string;
  gameName: string;
  isEnabled: boolean;
  connectEnabled: boolean;
  freeKeyEnabled: boolean;
  maintenanceMessage: string;
  downloadLink: string;
  floatingTextStatus: string;
  floatingText: string;
  modName: string;
  telegramChannel: string;
  telegramGroup: string;
  features: Record<string, boolean>;
  patches: string;
  registrator: string;
  announcement: string;
  announcementStatus: string;
}

const FEATURE_LABELS: Record<string, string> = {
  esp: 'ESP',
  item: 'Item',
  silentAim: 'Silent Aim',
  aim: 'AIM',
  bulletTrack: 'Bullet Track',
  memory: 'Memory',
  floating: 'Floating',
  setting: 'Setting',
};

export default function GameSettingsPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameSetting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ gameCode: '', gameName: '' });
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [editGame, setEditGame] = useState<GameSetting | null>(null);

  const fetchGames = async () => {
    const res = await fetch('/api/game-settings');
    const data = await res.json();
    setGames(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchGames(); }, [user]);

  if (!user) return <p className="text-muted-foreground">Please log in</p>;

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
      fetchGames();
    } else toast.error('Failed to add game');
  };

  const handleToggle = async (gameCode: string, field: string, value: boolean, registrator?: string) => {
    await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameCode, [field]: value, registrator }),
    });
    fetchGames();
  };

  const handleDelete = async (gameCode: string, registrator?: string) => {
    if (!confirm(`Delete game ${gameCode}?`)) return;
    await fetch('/api/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _method: 'DELETE', gameCode, registrator }),
    });
    toast.success('Game deleted');
    fetchGames();
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
        floatingTextStatus: editGame.floatingTextStatus,
        floatingText: editGame.floatingText,
        modName: editGame.modName,
        telegramChannel: editGame.telegramChannel,
        telegramGroup: editGame.telegramGroup,
        features: editGame.features,
        patches: editGame.patches,
        announcement: editGame.announcement,
        announcementStatus: editGame.announcementStatus,
      }),
    });
    if (res.ok) {
      toast.success('Game settings saved');
      setEditGame(null);
      fetchGames();
    } else toast.error('Failed to save game settings');
  };

  const toggleFeature = (key: string) => {
    if (!editGame) return;
    setEditGame({ ...editGame, features: { ...editGame.features, [key]: !editGame.features[key] } });
  };

  const copyFreeKeyLink = (registrator: string) => {
    const url = `${window.location.origin}/${registrator}/free-key`;
    navigator.clipboard.writeText(url);
    toast.success('Free key link copied');
  };

  const openEditGame = (game: GameSetting) => {
    setEditGame({ ...game });
    setExpandedGame(expandedGame === game._id ? null : game._id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Game Settings</h2>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25"><Plus className="h-4 w-4 mr-2" />Add Game</Button>} />
          <DialogContent className="border-border/30 bg-background/95 backdrop-blur-xl">
            <DialogHeader><DialogTitle>Add Game</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Game Code</Label>
                <Input value={form.gameCode} onChange={e => setForm({ ...form, gameCode: e.target.value.toUpperCase() })} placeholder="e.g., CODM" className="bg-background/60 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Game Name</Label>
                <Input value={form.gameName} onChange={e => setForm({ ...form, gameName: e.target.value })} placeholder="e.g., Call of Duty Mobile" className="bg-background/60 border-border/50" />
              </div>
              <Button onClick={handleAdd} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">Add Game</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 ? (
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
            <CardContent className="py-8 text-center text-muted-foreground">No games configured</CardContent>
          </Card>
        </div>
      ) : games.map(g => (
        <div key={g._id} className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="font-mono">{g.gameCode}</Badge>
                <CardTitle className="text-base">{g.gameName}</CardTitle>
                {g.registrator && <Badge variant="secondary" className="text-xs">{g.registrator}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex flex-wrap items-center gap-4 text-sm flex-1 lg:flex-none">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={g.isEnabled} onCheckedChange={v => handleToggle(g.gameCode, 'isEnabled', v, g.registrator)} />
                    <span className="text-muted-foreground whitespace-nowrap">Enabled</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={g.connectEnabled} onCheckedChange={v => handleToggle(g.gameCode, 'connectEnabled', v, g.registrator)} />
                    <span className="text-muted-foreground whitespace-nowrap">Connect</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch checked={g.freeKeyEnabled} onCheckedChange={v => handleToggle(g.gameCode, 'freeKeyEnabled', v, g.registrator)} />
                    <span className="text-muted-foreground whitespace-nowrap">Free Key</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => copyFreeKeyLink(g.registrator)}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="whitespace-nowrap">Free Key Link</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1 ml-auto lg:ml-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditGame(g)}>
                    {expandedGame === g._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(g.gameCode, g.registrator)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          {expandedGame === g._id && editGame && editGame._id === g._id && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Input
                  value={editGame.maintenanceMessage || ''}
                  onChange={e => setEditGame({ ...editGame, maintenanceMessage: e.target.value })}
                  placeholder="Game-specific maintenance message"
                  className="bg-background/60 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Download Link</Label>
                <Input
                  value={editGame.downloadLink || ''}
                  onChange={e => setEditGame({ ...editGame, downloadLink: e.target.value })}
                  placeholder="Mod download URL"
                  className="bg-background/60 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Mod Name</Label>
                <Input
                  value={editGame.modName || ''}
                  onChange={e => setEditGame({ ...editGame, modName: e.target.value })}
                  placeholder="e.g., Winter Mod, ProTech Mod"
                  className="bg-background/60 border-border/50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telegram Channel</Label>
                    <Input
                      value={editGame.telegramChannel || ''}
                      onChange={e => setEditGame({ ...editGame, telegramChannel: e.target.value })}
                      placeholder="https://t.me/channel"
                      className="bg-background/60 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telegram Group</Label>
                    <Input
                      value={editGame.telegramGroup || ''}
                      onChange={e => setEditGame({ ...editGame, telegramGroup: e.target.value })}
                      placeholder="https://t.me/group"
                      className="bg-background/60 border-border/50"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Floating Text Status</Label>
                <Input
                  value={editGame.floatingTextStatus || ''}
                  onChange={e => setEditGame({ ...editGame, floatingTextStatus: e.target.value })}
                  placeholder="e.g., active, vip"
                  className="bg-background/60 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Floating Text</Label>
                <Textarea
                  value={editGame.floatingText || ''}
                  onChange={e => setEditGame({ ...editGame, floatingText: e.target.value })}
                  placeholder="Text shown as floating overlay in-game"
                  className="bg-background/60 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch checked={editGame.features?.[key] ?? false} onCheckedChange={() => toggleFeature(key)} />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Patches (Lua)</Label>
                <Textarea
                  value={editGame.patches || ''}
                  onChange={e => setEditGame({ ...editGame, patches: e.target.value })}
                  placeholder="-- Custom Lua patches here..."
                  className="font-mono text-xs h-32 bg-background/60 border-border/50"
                />
                <p className="text-xs text-muted-foreground">This code will be executed on the client. Use <code>HexPatches.MemoryPatch</code> for memory edits.</p>
              </div>

              <div className="space-y-4 border-t pt-4 mt-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  Announcement
                </div>
                <p className="text-[10px] text-muted-foreground">
                  A message shown to users after successful login. Fetched by the app from <code className="text-xs bg-muted px-1 py-0.5 rounded">/{editGame.registrator}/announcement</code>.
                </p>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editGame.announcementStatus === 'on'}
                    onCheckedChange={v => setEditGame({ ...editGame, announcementStatus: v ? 'on' : 'off' })}
                  />
                  <Label className="text-xs">Show Announcement</Label>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Announcement Message</Label>
                  <Textarea
                    value={editGame.announcement || ''}
                    onChange={e => setEditGame({ ...editGame, announcement: e.target.value })}
                    placeholder="Enter announcement text..."
                    className="text-xs min-h-[60px] bg-background/60 border-border/50"
                  />
                </div>
              </div>

              <Button onClick={handleSaveGame} size="sm" className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">Save Game Settings</Button>
            </CardContent>
          )}
        </Card>
      </div>
      ))}
    </div>
  );
}