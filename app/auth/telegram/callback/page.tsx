'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/shared/AuthProvider';

function TelegramCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If already authenticated, redirect away — no re-auth needed
    if (user) {
      router.replace('/dashboard');
      return;
    }

    const mode = sessionStorage.getItem('telegram_auth_mode') || 'login';
    sessionStorage.removeItem('telegram_auth_mode');

    // Telegram can send auth data via query params or as a hash fragment
    let authParams: Record<string, string> | null = null;

    // Check query params first (direct redirect or onTelegramAuth POST)
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');

    if (id && hash) {
      authParams = {};
      for (const [key, value] of searchParams.entries()) {
        authParams[key] = value;
      }
    } else {
      // Try extracting from URL hash fragment
      const fragment = window.location.hash;
      if (fragment.startsWith('#tgAuthResult=')) {
        try {
          const base64 = fragment.slice('#tgAuthResult='.length);
          const decoded = decodeURIComponent(escape(atob(base64)));
          const parsed = JSON.parse(decoded);
          if (parsed.id && parsed.hash) {
            authParams = {
              id: String(parsed.id),
              first_name: parsed.first_name || '',
              last_name: parsed.last_name || '',
              username: parsed.username || '',
              photo_url: parsed.photo_url || '',
              auth_date: String(parsed.auth_date),
              hash: parsed.hash,
            };
          }
        } catch {
          // Invalid base64/JSON in hash fragment
        }
      }
    }

    if (!authParams) {
      setStatus('error');
      setErrorMessage('Missing Telegram authentication data');
      return;
    }

    const processAuth = async () => {
      try {
        if (mode === 'connect') {
          const res = await fetch('/api/auth/telegram/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authParams),
          });
          const result = await res.json();

          if (res.ok) {
            toast.success('Telegram account connected');
            await refreshUser();
            router.replace('/settings');
            return;
          }

          setStatus('error');
          setErrorMessage(result.error || 'Failed to connect Telegram');
        } else {
          const query = new URLSearchParams(authParams).toString();
          const res = await fetch(`/api/auth/telegram/callback?${query}`);
          const result = await res.json();

          if (res.ok) {
            toast.success('Login successful');
            router.replace('/dashboard');
            return;
          }

          setStatus('error');
          if (result.code === 'TELEGRAM_NOT_LINKED') {
            setErrorMessage('No account linked to this Telegram. Please register first, then connect your Telegram in Settings.');
          } else {
            setErrorMessage(result.error || 'Telegram login failed');
          }
        }
      } catch {
        setStatus('error');
        setErrorMessage('Network error');
      }
    };

    processAuth();
  }, [searchParams, router, refreshUser, user]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Authenticating with Telegram...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 text-center space-y-4">
        <p className="text-destructive">{errorMessage}</p>
        <div className="flex gap-2 justify-center">
          <a href="/login" className="text-primary hover:underline text-sm">Back to Login</a>
          <span className="text-muted-foreground">|</span>
          <a href="/settings" className="text-primary hover:underline text-sm">Settings</a>
        </div>
      </div>
    </div>
  );
}

export default function TelegramCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Authenticating with Telegram...</p>
        </div>
      }
    >
      <TelegramCallbackContent />
    </Suspense>
  );
}