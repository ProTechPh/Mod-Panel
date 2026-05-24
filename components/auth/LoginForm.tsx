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
import { Moon, Sun, Sparkles, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

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
        router.replace('/dashboard');
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
    if (siteKey && !data.turnstileToken) {
      toast.error('Please complete the captcha');
      return;
    }
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
        router.replace('/dashboard');
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
    window.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}/auth/telegram/callback&request_access=write`;
  };

  return (
    <div className="relative group">
      {/* Animated border glow */}
      <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-2xl opacity-40 blur-sm group-hover:opacity-70 transition-all duration-1000 animate-pulse" style={{ animationDuration: '4s' }} />

      <Card className="relative border-0 bg-background/80 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Decorative gradient lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        <CardHeader className="text-center relative">
          <div className="flex justify-between items-center mb-2">
            <div />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full blur-xl opacity-60 animate-pulse" style={{ animationDuration: '3s' }} />
              <Image src="/logo.jpg" alt="Mod Panel Logo" width={72} height={72} priority unoptimized className="relative w-18 h-18 object-contain rounded-full ring-2 ring-purple-500/30" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              {APP_NAME}
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground/80 flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3 text-purple-400" />
            Sign in to your account
            <Sparkles className="h-3 w-3 text-cyan-400" />
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-muted-foreground">Username or Email</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'identifier' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'identifier' ? 'opacity-100' : ''}`} />
                <Input
                  id="identifier"
                  {...register('identifier')}
                  placeholder="Enter username or email"
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  className="relative bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all"
                />
              </div>
              {errors.identifier && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.identifier.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Password</Label>
                <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : ''}`} />
                <div className="relative flex">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter password"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {errors.password && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.password.message}</p>}
            </div>

            {siteKey && (
              <div className="flex justify-center my-4">
                <Turnstile
                  siteKey={siteKey}
                  onSuccess={(token) => setValue('turnstileToken', token)}
                  options={{ theme: theme === 'dark' ? 'dark' : 'light' }}
                />
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground/60">or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 border-border/50 bg-background/40 hover:bg-background/60 hover:border-purple-500/30 transition-all duration-300 group/btn" disabled={tgLoading} onClick={handleTelegramLogin}>
              {tgLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5 text-[#26A5E4] group-hover/btn:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                  <span className="group-hover/btn:text-purple-300 transition-colors">Sign In with Telegram</span>
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground/70">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors relative group/link">
                Register
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-purple-400 to-fuchsia-400 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" />
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
