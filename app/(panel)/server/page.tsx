'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { Clock, Wrench, AlertTriangle, Power, MessageSquare, Save, Terminal, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

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
    void (async () => {
      try {
        const res = await fetch('/api/server-config');
        const data = await res.json();
        setConfig(data);
      } catch { toast.error('Failed to load config'); }
      finally { setLoading(false); }
    })();
  }, []);

  const elapsed = useElapsed(config?.maintenanceStartedAt ?? null, config?.maintenanceStatus === 'on');

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;
  if (loading || !config) return <p style={{ color: 'var(--text-mid)' }}>Loading…</p>;

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
        toast.success(value ? 'Maintenance ON — key timers are now paused' : 'Maintenance OFF — key timers have been extended');
      } else {
        toast.error('Failed to update maintenance status');
      }
    } finally { setToggling(false); }
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
    } finally { setSaving(false); }
  };

  const isOn = config.maintenanceStatus === 'on';

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operator Console"
        title="SERVER"
        highlight="CONFIG"
        sub="Toggle global maintenance and broadcast a downtime message to all users."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr] items-start">
        {/* Left Column: Power Core Controller */}
        <div className="panel fade-up d1">
          <div className="panel-head" style={{ borderBottomColor: isOn ? 'rgba(234, 88, 12, 0.25)' : 'var(--border)' }}>
            <h2 className="panel-title">
              <Terminal size={14} className="text-orange-500" />
              <span>Power Core</span>
            </h2>
            <StatusBadge status={isOn ? 'warning' : 'success'} withDot>
              {isOn ? 'Maintenance Active' : 'System Operational'}
            </StatusBadge>
          </div>

          <div className="p-5 space-y-5">
            {/* Core Power Switch */}
            <div className="rounded-lg border border-white/5 bg-black/20 p-4 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <Label className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-slate-300">
                  <Power className="h-3 w-3" /> System Bypass Link
                </Label>
                <span className="text-[10px] text-slate-500">// Pauses reseller key expirations</span>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={v => void handleMaintenanceToggle(v)}
                disabled={toggling}
              />
            </div>

            {/* Downtime Ticker details */}
            {isOn && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle size={14} />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">Pauses Active</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Elapsed Ticks:</span>
                  <span className="text-white font-bold">{elapsed || 'Initializing…'}</span>
                </div>
              </div>
            )}

            {/* Telemetry info */}
            <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4 space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Kernel Node:</span>
                <span className="text-white">NODE-01</span>
              </div>
              <div className="flex justify-between">
                <span>API Gateway:</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>DB Bypass:</span>
                <span className="text-emerald-400">READY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Console */}
        <Card className="fade-up d2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
              Broadcast Terminal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block">// broadcast message buffer</span>
              <Textarea
                placeholder="No maintenance message set."
                value={config.maintenanceMessage}
                onChange={e => setConfig({ ...config, maintenanceMessage: e.target.value })}
                rows={5}
                className="font-mono text-xs bg-black/30 border-white/10"
              />
            </div>
            <Button onClick={handleSaveMessage} disabled={saving} className="w-full">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Broadcast Payload
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
