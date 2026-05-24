'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success(result.message || 'Password reset successfully');
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-red-400">Invalid or missing reset token.</p>
        <Button variant="outline" onClick={() => router.push('/forgot-password')} className="border-purple-500/30 hover:border-purple-500/50">
          Request New Reset Link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
        <p className="text-emerald-400 font-medium text-lg">Password reset successfully!</p>
        <p className="text-sm text-muted-foreground/70">Your password has been updated. You can now sign in with your new password.</p>
        <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25" onClick={() => router.push('/login')}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('token')} />
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">New Password</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="Enter new password" autoComplete="new-password" className="bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm Password</Label>
        <div className="relative">
          <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} placeholder="Confirm new password" autoComplete="new-password" className="bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all pr-10" />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Resetting...
          </span>
        ) : 'Reset Password'}
      </Button>
      <p className="text-center text-sm text-muted-foreground/70">
        Remember your password?{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign In</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { theme } = useTheme();

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
            <button onClick={() => {
              const t = theme === 'dark' ? 'light' : 'dark';
              document.documentElement.classList.toggle('dark', t === 'dark');
              localStorage.setItem('theme', t);
            }} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
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
            Set a new password
            <Sparkles className="h-3 w-3 text-cyan-400" />
          </p>
        </div>
        <div className="p-6 pt-2">
          <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
