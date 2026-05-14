'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStreamerAuth } from '@/components/shared/StreamerAuthProvider';
import { toast } from 'sonner';
import { Loader2, Key, Radio } from 'lucide-react';

export default function StreamerLoginPage() {
  const router = useRouter();
  const { setStreamer } = useStreamerAuth();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast.error('Please enter your license key');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/streamer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStreamer(data.streamer);
        toast.success('Welcome back, streamer!');
        router.push('/streamer/dashboard');
      } else {
        toast.error(data.error || 'Invalid license key');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Radio className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Streamer Panel</CardTitle>
          <p className="text-muted-foreground text-sm">
            Enter your license key to access your dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="key">License Key</Label>
              <div className="relative">
                <Input
                  id="key"
                  type="text"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="TL-XXXXXXXXXXXX"
                  className="pl-10 font-mono tracking-wider text-center text-lg"
                  autoFocus
                  disabled={loading}
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
