'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { Clock, ShieldAlert } from 'lucide-react';

interface ServerConfig {
  maintenanceStatus: string;
  maintenanceMessage: string;
  maintenanceStartedAt: string | null;
}

function useElapsed(startedAt: string | null, isOn: boolean) {
  const [elapsed, setElapsed] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isOn || !startedAt) { setElapsed(''); return; }

    const tick = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setElapsed(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startedAt, isOn]);

  return elapsed;
}

export default function ServerPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/server-config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => toast.error('Failed to load config'))
      .finally(() => setLoading(false));
  }, []);

  const elapsed = useElapsed(config?.maintenanceStartedAt ?? null, config?.maintenanceStatus === 'on');

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;
  if (loading || !config) return <p>Loading...</p>;

  // Maintenance toggle saves immediately so the timestamp is exact
  const handleMaintenanceToggle = async (value: boolean) => {
    setToggling(true);
    const newStatus = value ? 'on' : 'off';
    try {
      const res = await fetch('/api/server-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceStatus: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        toast.success(
          value
            ? 'Maintenance ON — key timers are now paused'
            : 'Maintenance OFF — key timers have been extended'
        );
      } else {
        toast.error('Failed to update maintenance status');
      }
    } finally {
      setToggling(false);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/server-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMessage: config.maintenanceMessage }),
      });
      if (res.ok) toast.success('Message saved');
      else toast.error('Failed to save message');
    } finally {
      setSaving(false);
    }
  };

  const isOn = config.maintenanceStatus === 'on';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Server Config</h2>
      </div>

      <Card className={`border-border/50 ${isOn ? 'border-amber-500/60 bg-amber-500/5' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className={`h-4 w-4 ${isOn ? 'text-amber-500' : 'text-muted-foreground'}`} />
            Maintenance Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={isOn}
              onCheckedChange={handleMaintenanceToggle}
              disabled={toggling}
            />
            <Label className="text-xs">Maintenance Mode</Label>
            {isOn && elapsed && (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full ml-auto border border-amber-500/20">
                <Clock className="h-3 w-3" />
                {elapsed} — key timers paused
              </span>
            )}
          </div>

          {isOn && (
            <p className="text-[10px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1.5">
              All active key timers are paused. When maintenance ends, timers will automatically be extended by the full downtime duration.
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Maintenance Message</Label>
            <Textarea
              value={config.maintenanceMessage}
              onChange={e => setConfig({ ...config, maintenanceMessage: e.target.value })}
              placeholder="Message shown to users during maintenance..."
              className="text-xs min-h-[60px]"
            />
            <Button onClick={handleSaveMessage} disabled={saving} size="sm" variant="secondary" className="h-7 text-xs">
              {saving ? 'Saving...' : 'Update Maintenance Message'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}