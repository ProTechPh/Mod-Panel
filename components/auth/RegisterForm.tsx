'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, Sparkles, Eye, EyeOff, User, Mail, UserCircle, KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { APP_NAME } from '@/lib/constants';

import { Turnstile } from '@marsidev/react-turnstile';

export default function RegisterForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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
            Create your account
            <Sparkles className="h-3 w-3 text-cyan-400" />
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'username' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'username' ? 'opacity-100' : ''}`} />
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="username"
                    {...register('username')}
                    placeholder="Choose a username"
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all"
                  />
                </div>
              </div>
              {errors.username && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-100' : ''}`} />
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all"
                  />
                </div>
              </div>
              {errors.email && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <div className={`relative transition-all duration-300 ${focusedField === 'fullname' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'fullname' ? 'opacity-100' : ''}`} />
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="fullname"
                    {...register('fullname')}
                    placeholder="Enter full name"
                    onFocus={() => setFocusedField('fullname')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all"
                  />
                </div>
              </div>
              {errors.fullname && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.fullname.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Password</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                  <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : ''}`} />
                  <div className="relative flex">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Password"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 pl-10 bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all pr-10"
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
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm</Label>
                <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'scale-[1.01]' : ''}`}>
                  <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 to-fuchsia-500/50 rounded-lg opacity-0 transition-opacity duration-300 ${focusedField === 'confirmPassword' ? 'opacity-100' : ''}`} />
                  <div className="relative flex">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Confirm"
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 pl-10 bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all pr-10"
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
              <Label htmlFor="referralCode" className="text-sm font-medium text-muted-foreground">Referral Code <span className="text-muted-foreground/40">(optional)</span></Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  {...register('referralCode')}
                  placeholder="Enter referral code"
                  className="bg-background/60 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/40 transition-all"
                />
              </div>
              {errors.referralCode && <p className="text-sm text-red-400 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-400" />{errors.referralCode.message}</p>}
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
                  Creating account...
                </span>
              ) : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground/70">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors relative group/link">
                Sign in
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-purple-400 to-fuchsia-400 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" />
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
