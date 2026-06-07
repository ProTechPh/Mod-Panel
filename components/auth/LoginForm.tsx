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
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginForm() {
  const router = useRouter();
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
      {/* Animated border glow — teal cyberpunk */}
      <div className="absolute -inset-[2px] rounded-2xl opacity-40 blur-sm group-hover:opacity-70 transition-all duration-1000 animate-pulse" style={{ background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2), var(--teal-neon), var(--ecto-green))', animationDuration: '4s' }} />

      <Card className="relative border-0 backdrop-blur-xl shadow-2xl overflow-hidden" style={{ background: 'rgba(9, 19, 24, 0.85)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(20, 184, 184, 0.08)' }}>
        {/* Decorative gradient lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--teal-2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--ecto-green), transparent)' }} />

        <CardHeader className="text-center relative">
          <div className="flex flex-col items-center gap-3 mb-2 pt-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', animationDuration: '3s' }} />
              <Image src="/logo.jpg" alt="Mod Panel Logo" width={72} height={72} priority unoptimized className="relative w-18 h-18 object-contain rounded-full" style={{ border: '2px solid rgba(20, 184, 184, 0.3)', boxShadow: 'var(--glow-sm)' }} />
            </div>
            <CardTitle className="text-2xl font-bold" style={{ fontFamily: 'var(--ff-display)', background: 'linear-gradient(90deg, var(--teal-3), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.06em' }}>
              {APP_NAME}
            </CardTitle>
          </div>
          <CardDescription className="flex items-center justify-center gap-2" style={{ color: 'var(--text-mid)' }}>
            <Sparkles className="h-3 w-3" style={{ color: 'var(--teal-2)' }} />
            Sign in to your account
            <Sparkles className="h-3 w-3" style={{ color: 'var(--ecto-green)' }} />
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Username or Email</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'identifier' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'identifier' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                <Input
                  id="identifier"
                  {...register('identifier')}
                  placeholder="Enter username or email"
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  className="relative placeholder:text-muted-foreground/40 transition-all"
                  style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                />
              </div>
              {errors.identifier && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.identifier.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Password</Label>
                <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: 'var(--teal-2)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                <div className="relative flex">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter password"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 placeholder:text-muted-foreground/40 transition-all pr-10"
                    style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
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
                  options={{ theme: 'dark' }}
                />
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-white" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', boxShadow: '0 4px 20px rgba(20, 184, 184, 0.3)' }} disabled={loading}>
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
              <div className="absolute inset-0 flex items-center"><span className="w-full" style={{ borderTop: '1px solid rgba(20, 184, 184, 0.15)' }} /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-3" style={{ background: 'rgba(9, 19, 24, 0.9)', color: 'var(--text-lo)' }}>or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 transition-all duration-300 group/btn" style={{ borderColor: 'rgba(20, 184, 184, 0.2)', background: 'rgba(2, 6, 8, 0.4)' }} disabled={tgLoading} onClick={handleTelegramLogin}>
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
                  <span className="group-hover/btn:text-teal-300 transition-colors">Sign In with Telegram</span>
                </>
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: 'var(--text-mid)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium transition-colors relative group/link" style={{ color: 'var(--teal-2)' }}>
                Register
                <span className="absolute bottom-0 left-0 w-full h-[1px] scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" style={{ background: 'linear-gradient(90deg, var(--teal-2), var(--ecto-green))' }} />
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
