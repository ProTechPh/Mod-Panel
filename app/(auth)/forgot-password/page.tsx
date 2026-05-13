'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, ArrowLeft, Copy, Check } from 'lucide-react';
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
        <CardDescription>Reset your password</CardDescription>
      </CardHeader>
      <CardContent>
        {resetData ? (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Reset link generated for <strong>{resetData.username}</strong></p>
              <p className="text-xs text-muted-foreground">
                Share this reset URL with the user. It expires in 1 hour.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background rounded px-2 py-1 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/reset-password?token=${resetData.token}` : ''}
                </code>
                <Button size="sm" variant="outline" onClick={copyResetUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setResetData(null)}>
              Reset Another Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Email</Label>
              <Input
                id="identifier"
                {...register('identifier')}
                placeholder="Enter username or email"
                autoComplete="username"
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier.message}</p>
              )}
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Reset Link'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline">Sign In</Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
