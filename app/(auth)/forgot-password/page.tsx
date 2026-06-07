'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, ArrowLeft, Copy, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [resetData, setResetData] = useState<{ token: string; username: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    if (siteKey && !data.turnstileToken) {
      toast.error('Please complete the captcha');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok) {
        if (result.token) {
          setResetData({ token: result.token, username: result.username });
          toast.success('Reset link generated');
        } else {
          toast.success('If an account exists, a reset link has been generated.');
        }
      } else {
        toast.error(result.error || 'Failed to generate reset link');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyResetUrl = () => {
    if (!resetData) return;
    const url = `${window.location.origin}/reset-password?token=${resetData.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Reset URL copied to clipboard');
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-[2px] rounded-2xl opacity-40 blur-sm group-hover:opacity-70 transition-all duration-1000 animate-pulse" style={{ background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2), var(--teal-neon), var(--ecto-green))', animationDuration: '4s' }} />
      <div className="relative border-0 backdrop-blur-xl shadow-2xl overflow-hidden rounded-xl" style={{ background: 'rgba(9, 19, 24, 0.85)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(20, 184, 184, 0.08)' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--teal-2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--ecto-green), transparent)' }} />
        <div className="text-center p-6 pb-2">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => router.push('/login')} className="h-8 w-8 flex items-center justify-center rounded-md transition-all" style={{ color: 'var(--text-mid)' }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded-md transition-all" style={{ color: 'var(--text-mid)' }}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', animationDuration: '3s' }} />
              <Image src="/logo.jpg" alt="Mod Panel Logo" width={72} height={72} priority unoptimized className="relative w-18 h-18 object-contain rounded-full" style={{ border: '2px solid rgba(20, 184, 184, 0.3)', boxShadow: 'var(--glow-sm)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--ff-display)', background: 'linear-gradient(90deg, var(--teal-3), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.06em' }}>{APP_NAME}</p>
          </div>
          <p className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
            <Sparkles className="h-3 w-3" style={{ color: 'var(--teal-2)' }} />
            Reset your password
            <Sparkles className="h-3 w-3" style={{ color: 'var(--ecto-green)' }} />
          </p>
        </div>
        <div className="p-6 pt-2">
          {resetData ? (
            <div className="space-y-4">
              <div className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(20, 184, 184, 0.05)', border: '1px solid rgba(20, 184, 184, 0.15)' }}>
                <p className="text-sm font-medium">Reset link generated for <strong style={{ color: 'var(--teal-3)' }}>{resetData.username}</strong></p>
                <p className="text-xs" style={{ color: 'var(--text-lo)' }}>Share this reset URL with the user. It expires in 1 hour.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs rounded px-2 py-1.5 truncate font-mono" style={{ background: 'rgba(2, 6, 8, 0.6)', border: '1px solid rgba(20, 184, 184, 0.15)', color: 'var(--text-mid)' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/reset-password?token=${resetData.token}` : ''}
                  </code>
                  <button onClick={copyResetUrl} className="h-8 w-8 flex items-center justify-center rounded-md transition-all" style={{ border: '1px solid rgba(20, 184, 184, 0.2)' }}>
                    {copied ? <Check className="h-4 w-4" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-4 w-4" style={{ color: 'var(--text-mid)' }} />}
                  </button>
                </div>
              </div>
              <button onClick={() => setResetData(null)} className="w-full h-11 rounded-lg text-sm font-medium transition-all" style={{ border: '1px solid rgba(20, 184, 184, 0.2)', background: 'rgba(2, 6, 8, 0.4)', color: 'var(--text-mid)' }}>
                Reset Another Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Username or Email</Label>
                <Input id="identifier" {...register('identifier')} placeholder="Enter username or email" autoComplete="username" className="placeholder:text-muted-foreground/40 transition-all" style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }} />
                {errors.identifier && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.identifier.message}</p>}
              </div>
              {siteKey && (
                <div className="flex justify-center my-4">
                  <Turnstile siteKey={siteKey} onSuccess={(token) => setValue('turnstileToken', token)} options={{ theme: theme === 'dark' ? 'dark' : 'light' }} />
                </div>
              )}
              <Button type="submit" className="w-full h-11 font-semibold transition-all duration-300 text-white" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', boxShadow: '0 4px 20px rgba(20, 184, 184, 0.3)' }} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Reset Link'}
              </Button>
              <p className="text-center text-sm" style={{ color: 'var(--text-mid)' }}>
                Remember your password?{' '}
                <Link href="/login" className="font-medium transition-colors" style={{ color: 'var(--teal-2)' }}>Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
