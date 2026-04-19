'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';

export default function FreeKeyPage() {
  const { theme, toggleTheme } = useTheme();
  const [game, setGame] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { toast.error('Complete captcha verification'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/free-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, turnstileToken }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data.key);
        toast.success('Key generated!');
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch {
      toast.error('Network error');
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
          <CardDescription>Generate a free 1-hour key</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Game</Label>
              <Select value={game} onValueChange={v => setGame(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODM">CODM</SelectItem>
                  <SelectItem value="PBS">PBS</SelectItem>
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