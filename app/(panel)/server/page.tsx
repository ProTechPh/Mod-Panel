'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';

interface ServerConfig {
  maintenanceStatus: string;
  maintenanceMessage: string;
}

export default function ServerPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/server-config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => toast.error('Failed to load config'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.level !== 1) return <p className="text-muted-foreground">Access denied</p>;
  if (loading || !config) return <p>Loading...</p>;

  const handleSave = async () => {
    const res = await fetch('/api/server-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) toast.success('Config saved');
    else toast.error('Failed to save config');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Server Config</h2>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle>Maintenance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={config.maintenanceStatus === 'on'} onCheckedChange={v => setConfig({ ...config, maintenanceStatus: v ? 'on' : 'off' })} />
            <Label>Maintenance Mode</Label>
          </div>
          <div className="space-y-2">
            <Label>Maintenance Message</Label>
            <Textarea value={config.maintenanceMessage} onChange={e => setConfig({ ...config, maintenanceMessage: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}