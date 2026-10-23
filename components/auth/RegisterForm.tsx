'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

import { Turnstile } from '@marsidev/react-turnstile';

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    if (siteKey && !data.turnstileToken) {
      toast.error('Please complete the captcha');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Registration successful');
        router.replace('/dashboard');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="items-center gap-3 px-6 pb-2 pt-4 text-center">
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full blur-xl"
            style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.55), transparent 70%)' }}
          />
          <Image
            src="/logo.jpg"
            alt=""
            width={64}
            height={64}
            priority
            unoptimized
            className="relative size-16 rounded-full object-contain"
            style={{ border: '1px solid rgba(234, 88, 12, 0.5)', boxShadow: '0 0 20px rgba(234, 88, 12, 0.25)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h1
            className="text-xl font-extrabold uppercase"
            style={{
              fontFamily: 'var(--ff-display)',
              letterSpacing: '0.1em',
              background: 'linear-gradient(90deg, var(--brand-300), var(--brand-glow))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {APP_NAME}
          </h1>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--text-lo)]">
            Request operator access
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="field">
            <Label htmlFor="username" className="field-label">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="operator"
              aria-invalid={!!errors.username}
              {...register('username')}
            />
            {errors.username && <p className="field-error" role="alert">{errors.username.message}</p>}
          </div>

          <div className="field">
            <Label htmlFor="email" className="field-label">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="operator@domain.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
          </div>

          <div className="field">
            <Label htmlFor="fullname" className="field-label">Full name</Label>
            <Input
              id="fullname"
              autoComplete="name"
              placeholder="Jane Operator"
              aria-invalid={!!errors.fullname}
              {...register('fullname')}
            />
            {errors.fullname && <p className="field-error" role="alert">{errors.fullname.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="field">
              <Label htmlFor="password" className="field-label">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-lo)] transition-colors hover:bg-white/5 hover:text-[var(--text-hi)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="field-error" role="alert">{errors.password.message}</p>}
            </div>

            <div className="field">
              <Label htmlFor="confirmPassword" className="field-label">Confirm</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pr-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-lo)] transition-colors hover:bg-white/5 hover:text-[var(--text-hi)]"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="field">
            <Label htmlFor="referralCode" className="field-label">
              Referral code <span className="normal-case tracking-normal text-[var(--text-lo)]">(optional)</span>
            </Label>
            <Input
              id="referralCode"
              placeholder="REF-XXXX"
              aria-invalid={!!errors.referralCode}
              {...register('referralCode')}
            />
            {errors.referralCode && <p className="field-error" role="alert">{errors.referralCode.message}</p>}
          </div>

          {siteKey && (
            <div className="flex justify-center py-1">
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => setValue('turnstileToken', token)}
                options={{ theme: 'dark' }}
              />
            </div>
          )}

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <p className="text-center text-xs text-[var(--text-mid)]">
            Already registered?{' '}
            <Link
              href="/login"
              className="font-semibold text-[var(--brand-400)] underline-offset-4 transition-colors hover:text-[var(--brand-300)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
