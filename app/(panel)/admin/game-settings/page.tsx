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
import { Plus, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
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
        <h2 className="text-2xl font-bold tracking-tight">Game Settings</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Add Game</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Add Game</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Game Code</Label>
                <Input value={form.gameCode} onChange={e => setForm({ ...form, gameCode: e.target.value.toUpperCase() })} placeholder="e.g., CODM" />
              </div>
              <div className="space-y-2">
                <Label>Game Name</Label>
                <Input value={form.gameName} onChange={e => setForm({ ...form, gameName: e.target.value })} placeholder="e.g., Call of Duty Mobile" />
              </div>
              <Button onClick={handleAdd} className="w-full">Add Game</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">No games configured</CardContent>
        </Card>
      ) : games.map(g => (
        <Card key={g._id} className="border-border/50">
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
                />
              </div>
              <div className="space-y-2">
                <Label>Download Link</Label>
                <Input
                  value={editGame.downloadLink || ''}
                  onChange={e => setEditGame({ ...editGame, downloadLink: e.target.value })}
                  placeholder="Mod download URL"
                />
              </div>
              <div className="space-y-2">
                <Label>Mod Name</Label>
                <Input
                  value={editGame.modName || ''}
                  onChange={e => setEditGame({ ...editGame, modName: e.target.value })}
                  placeholder="e.g., Winter Mod, ProTech Mod"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telegram Channel</Label>
                  <Input
                    value={editGame.telegramChannel || ''}
                    onChange={e => setEditGame({ ...editGame, telegramChannel: e.target.value })}
                    placeholder="https://t.me/channel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telegram Group</Label>
                  <Input
                    value={editGame.telegramGroup || ''}
                    onChange={e => setEditGame({ ...editGame, telegramGroup: e.target.value })}
                    placeholder="https://t.me/group"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Floating Text Status</Label>
                <Input
                  value={editGame.floatingTextStatus || ''}
                  onChange={e => setEditGame({ ...editGame, floatingTextStatus: e.target.value })}
                  placeholder="e.g., active, vip"
                />
              </div>
              <div className="space-y-2">
                <Label>Floating Text</Label>
                <Textarea
                  value={editGame.floatingText || ''}
                  onChange={e => setEditGame({ ...editGame, floatingText: e.target.value })}
                  placeholder="Text shown as floating overlay in-game"
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
                  className="font-mono text-xs h-32"
                />
                <p className="text-xs text-muted-foreground">This code will be executed on the client. Use <code>HexPatches.MemoryPatch</code> for memory edits.</p>
              </div>
              <Button onClick={handleSaveGame} size="sm">Save Game Settings</Button>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}