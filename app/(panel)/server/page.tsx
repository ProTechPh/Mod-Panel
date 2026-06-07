'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { Clock, Wrench, AlertTriangle, Power, MessageSquare, Save } from 'lucide-react';
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

      <Card
        className="fade-up d1"
        style={{
          borderColor: isOn ? 'rgba(240, 192, 64, 0.5)' : undefined,
          background: isOn ? 'linear-gradient(180deg, rgba(240, 192, 64, 0.05), rgba(9, 19, 24, 0.85))' : undefined,
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOn
              ? <AlertTriangle className="h-4 w-4" style={{ color: 'var(--gold)' }} />
              : <Wrench className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />}
            Maintenance Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Switch
              checked={isOn}
              onCheckedChange={v => void handleMaintenanceToggle(v)}
              disabled={toggling}
            />
            <Label className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
              <Power className="h-3 w-3" /> Maintenance Mode
            </Label>
            <StatusBadge status={isOn ? 'warning' : 'success'} withDot>
              {isOn ? 'Active' : 'Offline'}
            </StatusBadge>
            {isOn && elapsed && (
              <span
                className="flex items-center gap-1.5 text-[10px] ml-auto"
                style={{
                  background: 'rgba(240, 192, 64, 0.1)',
                  color: 'var(--gold)',
                  padding: '0.2rem 0.7rem',
                  borderRadius: '50px',
                  border: '1px solid rgba(240, 192, 64, 0.3)',
                  fontFamily: 'var(--ff-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <Clock className="h-3 w-3" />
                {elapsed} · timers paused
              </span>
            )}
          </div>

          {isOn && (
            <div
              className="font-mono text-xs"
              style={{
                background: 'rgba(240, 192, 64, 0.05)',
                color: 'var(--gold)',
                border: '1px solid rgba(240, 192, 64, 0.2)',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
              }}
            >
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{'// '}</span>
              {'all active key timers are paused. when maintenance ends, timers auto-extend by the full downtime duration.'}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
              <MessageSquare className="h-3 w-3" style={{ color: 'var(--teal-2)' }} /> Maintenance Message
            </Label>
            <Textarea
              value={config.maintenanceMessage}
              onChange={e => setConfig({ ...config, maintenanceMessage: e.target.value })}
              placeholder="// Message shown to users during maintenance…"
              className="text-xs min-h-[80px]"
            />
            <Button onClick={handleSaveMessage} disabled={saving} size="sm" variant="secondary">
              <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving…' : 'Update Message'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
