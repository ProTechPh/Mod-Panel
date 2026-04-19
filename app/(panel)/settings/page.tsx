'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validators/user';
import { fullnameSchema, type FullnameInput } from '@/lib/validators/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/components/shared/AuthProvider';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullnameLoading, setFullnameLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramContact, setTelegramContact] = useState('');
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  useEffect(() => {
    if (user?.telegramContact) setTelegramContact(user.telegramContact);
  }, [user]);

  const onSubmitTelegram = async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch('/api/users/update-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramContact }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Telegram contact updated');
        await refreshUser();
      } else {
        toast.error(result.error || 'Failed to update telegram contact');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setTelegramLoading(false);
    }
  };

  // Password form
  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmitPassword = async (data: ChangePasswordInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Password changed successfully');
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const onDisconnectTelegram = async () => {
    setDisconnectLoading(true);
    try {
      const res = await fetch('/api/auth/telegram/disconnect', { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        toast.success('Telegram account disconnected');
        await refreshUser();
      } else {
        toast.error(result.error || 'Failed to disconnect Telegram');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDisconnectLoading(false);
    }
  };

  // Fullname form
  const { register: fullnameRegister, handleSubmit: handleFullnameSubmit, formState: { errors: fullnameErrors } } = useForm<FullnameInput>({
    resolver: zodResolver(fullnameSchema),
  });

  const onSubmitFullname = async (data: FullnameInput) => {
    setFullnameLoading(true);
    try {
      const res = await fetch('/api/users/update-fullname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname: data.fullname }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Fullname updated successfully');
        await refreshUser();
      } else {
        toast.error(result.error || 'Failed to update fullname');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setFullnameLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>

      {/* Change Password */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...passwordRegister('currentPassword')} />
              {passwordErrors.currentPassword && <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...passwordRegister('newPassword')} />
              {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" {...passwordRegister('confirmPassword')} />
              {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Update Fullname */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Update Fullname</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFullnameSubmit(onSubmitFullname)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Fullname</Label>
              <Input value={user?.fullname || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>New Fullname</Label>
              <Input {...fullnameRegister('fullname')} />
              {fullnameErrors.fullname && <p className="text-sm text-destructive">{fullnameErrors.fullname.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={fullnameLoading}>
              {fullnameLoading ? 'Updating...' : 'Update Fullname'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Telegram Contact */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Telegram Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contact Username</Label>
            <Input
              value={telegramContact}
              onChange={e => setTelegramContact(e.target.value)}
              placeholder="e.g., @CanKillYouForever"
            />
            <p className="text-sm text-muted-foreground">Shown to users in key error messages (incorrect key, expired, suspended, etc.)</p>
          </div>
          <Button onClick={onSubmitTelegram} disabled={telegramLoading}>
            {telegramLoading ? 'Saving...' : 'Save Telegram Contact'}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              <div>
                <p className="font-medium">Telegram</p>
                {user?.telegramId ? (
                  <p className="text-sm text-muted-foreground">@{user.telegramUsername || user.telegramId}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            {user?.telegramId ? (
              <Button variant="destructive" size="sm" onClick={onDisconnectTelegram} disabled={disconnectLoading}>
                {disconnectLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => {
                sessionStorage.setItem('telegram_auth_mode', 'connect');
                const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
                const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                window.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}/auth/telegram/callback&request_access=write`;
              }}>
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
