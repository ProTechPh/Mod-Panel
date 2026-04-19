'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

export default function LoginForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Handle Telegram auth hash fragment on this page
  useEffect(() => {
    const fragment = window.location.hash;
    if (!fragment.startsWith('#tgAuthResult=')) return;

    try {
      const base64 = fragment.slice('#tgAuthResult='.length);
      const decoded = decodeURIComponent(escape(atob(base64)));
      const user = JSON.parse(decoded);

      if (user.id && user.hash) {
        window.location.hash = '';
        handleTelegramAuth(user);
      }
    } catch {
      toast.error('Invalid Telegram authentication data');
    }
  }, []);

  const handleTelegramAuth = async (user: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string }) => {
    setTgLoading(true);
    try {
      const res = await fetch('/api/auth/telegram/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: String(user.id),
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: String(user.auth_date),
          hash: user.hash,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Login successful');
        router.push('/dashboard');
      } else if (result.code === 'TELEGRAM_NOT_LINKED') {
        toast.error('No account linked to this Telegram. Please register first, then connect your Telegram in Settings.');
      } else {
        toast.error(result.error || 'Telegram login failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setTgLoading(false);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Login successful');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = () => {
    sessionStorage.setItem('telegram_auth_mode', 'login');
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&request_access=write`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="text-center">
        <div className="flex justify-between items-center mb-2">
          <div />
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Username or Email</Label>
            <Input id="identifier" {...register('identifier')} placeholder="Enter username or email" />
            {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} placeholder="Enter password" />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>
          <Button type="button" variant="outline" className="w-full" disabled={tgLoading} onClick={handleTelegramLogin}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            {tgLoading ? 'Authenticating...' : 'Sign In with Telegram'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}