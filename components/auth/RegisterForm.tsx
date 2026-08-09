'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Eye, EyeOff, User, Mail, UserCircle, KeyRound, ShieldCheck } from 'lucide-react';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
            Create your account
            <Sparkles className="h-3 w-3" style={{ color: 'var(--ecto-green)' }} />
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Username</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'username' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'username' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: 'var(--text-lo)' }} />
                  <Input
                    id="username"
                    {...register('username')}
                    placeholder="Choose a username"
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 placeholder:text-muted-foreground/40 transition-all"
                    style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                  />
                </div>
              </div>
              {errors.username && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Email</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: 'var(--text-lo)' }} />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 placeholder:text-muted-foreground/40 transition-all"
                    style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                  />
                </div>
              </div>
              {errors.email && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Full Name</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'fullname' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'fullname' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: 'var(--text-lo)' }} />
                  <Input
                    id="fullname"
                    {...register('fullname')}
                    placeholder="Enter full name"
                    onFocus={() => setFocusedField('fullname')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 placeholder:text-muted-foreground/40 transition-all"
                    style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                  />
                </div>
              </div>
              {errors.fullname && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.fullname.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Password</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                  <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                  <div className="relative flex">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: 'var(--text-lo)' }} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Password"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 pl-10 placeholder:text-muted-foreground/40 transition-all pr-10"
                      style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Confirm</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'scale-[1.01]' : ''}`}>
                  <div className={`absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'confirmPassword' ? 'opacity-100' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(20,184,184,0.5), rgba(0,255,247,0.5))' }} />
                  <div className="relative flex">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: 'var(--text-lo)' }} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Confirm"
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 pl-10 placeholder:text-muted-foreground/40 transition-all pr-10"
                      style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>Referral Code</Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  {...register('referralCode')}
                  placeholder="Enter referral code"
                  className="placeholder:text-muted-foreground/40 transition-all"
                  style={{ background: 'rgba(2, 6, 8, 0.6)', borderColor: 'rgba(20, 184, 184, 0.2)' }}
                />
              </div>
              {errors.referralCode && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.referralCode.message}</p>}
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
                  Creating account...
                </span>
              ) : 'Create Account'}
            </Button>

            <p className="text-center text-sm" style={{ color: 'var(--text-mid)' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-medium transition-colors relative group/link" style={{ color: 'var(--teal-2)' }}>
                Sign in
                <span className="absolute bottom-0 left-0 w-full h-[1px] scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" style={{ background: 'linear-gradient(90deg, var(--teal-2), var(--ecto-green))' }} />
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
