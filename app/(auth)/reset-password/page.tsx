'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
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
        <Button variant="outline" onClick={() => router.push('/forgot-password')} style={{ borderColor: 'rgba(234, 88, 12, 0.3)', color: 'var(--text-mid)' }}>
          Request New Reset Link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(57, 255, 20, 0.15)' }}>
            <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--ecto-green)' }} />
          </div>
        </div>
        <p className="font-medium text-lg" style={{ color: 'var(--ecto-green)' }}>Password reset successfully!</p>
        <p className="text-sm" style={{ color: 'var(--text-mid)' }}>Your password has been updated. You can now sign in with your new password.</p>
        <Button className="w-full text-white" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', boxShadow: '0 4px 20px rgba(234, 88, 12, 0.3)' }} onClick={() => router.push('/login')}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('token')} />
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>New Password</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="Enter new password" autoComplete="new-password" className="placeholder:text-muted-foreground/40 transition-all pr-10" style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(234, 88, 12, 0.2)' }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-mid)' }}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Confirm Password</Label>
        <div className="relative">
          <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} placeholder="Confirm new password" autoComplete="new-password" className="placeholder:text-muted-foreground/40 transition-all pr-10" style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(234, 88, 12, 0.2)' }} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-mid)' }}>
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full h-11 font-semibold transition-all duration-300 text-white" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', boxShadow: '0 4px 20px rgba(234, 88, 12, 0.3)' }} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Resetting...
          </span>
        ) : 'Reset Password'}
      </Button>
      <p className="text-center text-sm" style={{ color: 'var(--text-mid)' }}>
        Remember your password?{' '}
        <Link href="/login" className="font-medium transition-colors" style={{ color: 'var(--teal-2)' }}>Sign In</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <div className="relative group">
      <div className="absolute -inset-[2px] rounded-2xl opacity-40 blur-sm group-hover:opacity-70 transition-all duration-1000 animate-pulse" style={{ background: 'linear-gradient(90deg, var(--teal-1), var(--teal-2), var(--teal-neon), var(--ecto-green))', animationDuration: '4s' }} />
      <div className="relative border-0 backdrop-blur-xl shadow-2xl overflow-hidden rounded-xl" style={{ background: 'rgba(13, 14, 19, 0.85)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(234, 88, 12, 0.08)' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--teal-2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--ecto-green), transparent)' }} />
        <div className="text-center p-6 pb-2">
          <div className="flex justify-start items-center mb-2">
            <button onClick={() => router.push('/login')} className="h-8 w-8 flex items-center justify-center rounded-md transition-all" style={{ color: 'var(--text-mid)' }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', animationDuration: '3s' }} />
              <Image src="/logo.jpg" alt="Mod Panel Logo" width={72} height={72} priority unoptimized className="relative w-18 h-18 object-contain rounded-full" style={{ border: '2px solid rgba(234, 88, 12, 0.3)', boxShadow: 'var(--glow-sm)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--ff-display)', background: 'linear-gradient(90deg, var(--teal-3), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.06em' }}>{APP_NAME}</p>
          </div>
          <p className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
            <Sparkles className="h-3 w-3" style={{ color: 'var(--teal-2)' }} />
            Set a new password
            <Sparkles className="h-3 w-3" style={{ color: 'var(--ecto-green)' }} />
          </p>
        </div>
        <div className="p-6 pt-2">
          <Suspense fallback={<p className="text-center" style={{ color: 'var(--text-mid)' }}>Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
