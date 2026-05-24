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
      <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-2xl opacity-40 blur-sm group-hover:opacity-70 transition-all duration-1000 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="relative border-0 bg-background/80 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-hidden rounded-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="text-center p-6 pb-2">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => router.push('/login')} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full blur-xl opacity-60 animate-pulse" style={{ animationDuration: '3s' }} />
              <Image src="/logo.jpg" alt="Mod Panel Logo" width={72} height={72} priority unoptimized className="relative w-18 h-18 object-contain rounded-full ring-2 ring-purple-500/30" />
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">{APP_NAME}</p>
          </div>
          <p className="text-muted-foreground/80 flex items-center justify-center gap-2 text-sm">
            <Sparkles className="h-3 w-3 text-purple-400" />
            Reset your password
            <Sparkles className="h-3 w-3 text-cyan-400" />
          </p>
        </div>
        <div className="p-6 pt-2">
          {resetData ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border/30 p-4 space-y-2">
                <p className="text-sm font-medium">Reset link generated for <strong className="text-purple-300">{resetData.username}</strong></p>
                <p className="text-xs text-muted-foreground/60">Share this reset URL with the user. It expires in 1 hour.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background/60 rounded px-2 py-1.5 truncate border border-border/20 font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/reset-password?token=${resetData.token}` : ''}
                  </code>
                  <button onClick={copyResetUrl} className="h-8 w-8 flex items-center justify-center rounded-md border border-border/30 hover:bg-accent/50 transition-all">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setResetData(null)} className="w-full h-11 rounded-lg border border-border/30 bg-background/40 hover:bg-background/60 text-sm font-medium transition-all">
                Reset Another Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium text-muted-foreground">Username or Email</Label>
                <Input id="identifier" {...register('identifier')} placeholder="Enter username or email" autoComplete="username" className="bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all" />
                {errors.identifier && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.identifier.message}</p>}
              </div>
              {siteKey && (
                <div className="flex justify-center my-4">
                  <Turnstile siteKey={siteKey} onSuccess={(token) => setValue('turnstileToken', token)} options={{ theme: theme === 'dark' ? 'dark' : 'light' }} />
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Reset Link'}
              </Button>
              <p className="text-center text-sm text-muted-foreground/70">
                Remember your password?{' '}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
