'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';

interface GameOption {
  code: string;
  name: string;
}

export default function FreeKeyPage() {
  const { registrator } = useParams<{ registrator: string }>();
  const { theme, toggleTheme } = useTheme();
  const [games, setGames] = useState<GameOption[]>([]);
  const [game, setGame] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/free-key/games?registrator=${encodeURIComponent(registrator)}`)
      .then(res => res.json())
      .then(data => setGames(Array.isArray(data) ? data : []))
      .catch(() => setGames([]));
  }, [registrator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { toast.error('Complete captcha verification'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/free-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, turnstileToken, registrator }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data.key);
        setError(null);
        toast.success('Key generated!');
      } else {
        setError(data.error || 'Failed to generate key');
        setResult(null);
      }
    } catch {
      setError('Network error');
      setResult(null);
    } finally {
      setLoading(false);
      setTurnstileToken('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold">Free Key Generator</CardTitle>
          <CardDescription>Generate a free 1-hour key from {registrator}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && !result && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md text-center">
              {error}
            </div>
          )}
          {games.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No free keys available from this reseller</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Game</Label>
                <Select value={game} onValueChange={v => setGame(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                  <SelectContent>
                    {games.map(g => (
                      <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAC1YlrS074UQWwgz'}
                  onSuccess={setTurnstileToken}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !game || !turnstileToken}>
                {loading ? 'Generating...' : 'Get Free Key'}
              </Button>
            </form>
          )}

          {result && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Your Key (1 hour):</p>
              <p className="font-mono text-sm break-all">{result}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                navigator.clipboard.writeText(result);
                toast.success('Copied to clipboard');
              }}>Copy</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}