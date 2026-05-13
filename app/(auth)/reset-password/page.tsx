'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
      <div className="text-center space-y-4">
        <p className="text-destructive">Invalid or missing reset token.</p>
        <Button variant="outline" onClick={() => router.push('/forgot-password')}>
          Request New Reset Link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-green-500 font-medium">Password reset successfully!</p>
        <p className="text-sm text-muted-foreground">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Button className="w-full" onClick={() => router.push('/login')}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('token')} />
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="text-primary hover:underline">Sign In</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <Card className="border-border/50">
      <CardHeader className="text-center">
        <div className="flex justify-between items-center mb-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/login')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 mb-2">
          <Image src="/logo.jpg" alt="Mod Panel Logo" width={64} height={64} priority unoptimized className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
        </div>
        <CardDescription>Set a new password</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
