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
import { Eye, EyeOff, User, Shield, KeyRound, Send, Lock, AtSign, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullnameLoading, setFullnameLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramContact, setTelegramContact] = useState('');
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => { if (user?.telegramContact) setTelegramContact(user.telegramContact); }, [user]);

  const onSubmitTelegram = async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch('/api/users/update-telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telegramContact }) });
      const result = await res.json();
      if (res.ok) { toast.success('Telegram contact updated'); await refreshUser(); } else toast.error(result.error || 'Failed to update telegram contact');
    } catch { toast.error('Network error');
    } finally { setTelegramLoading(false); }
  };

  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });
  const onSubmitPassword = async (data: ChangePasswordInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.ok) toast.success('Password changed successfully'); else toast.error(result.error || 'Failed to change password');
    } catch { toast.error('Network error');
    } finally { setLoading(false); }
  };

  const onDisconnectTelegram = async () => {
    setDisconnectLoading(true);
    try {
      const res = await fetch('/api/auth/telegram/disconnect', { method: 'POST' });
      const result = await res.json();
      if (res.ok) { toast.success('Telegram account disconnected'); await refreshUser(); } else toast.error(result.error || 'Failed to disconnect Telegram');
    } catch { toast.error('Network error');
    } finally { setDisconnectLoading(false); }
  };

  const { register: fullnameRegister, handleSubmit: handleFullnameSubmit, formState: { errors: fullnameErrors } } = useForm<FullnameInput>({ resolver: zodResolver(fullnameSchema) });
  const onSubmitFullname = async (data: FullnameInput) => {
    setFullnameLoading(true);
    try {
      const res = await fetch('/api/users/update-fullname', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullname: data.fullname }) });
      const result = await res.json();
      if (res.ok) { toast.success('Fullname updated successfully'); await refreshUser(); } else toast.error(result.error || 'Failed to update fullname');
    } catch { toast.error('Network error');
    } finally { setFullnameLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        eyebrow="Account Preferences"
        title="SETTINGS"
        sub="Manage your password, identity, and connected services."
      />

      <Card className="fade-up d1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Lock className="inline h-3 w-3 mr-1" /> Current Password
              </Label>
              <div className="relative">
                <Input type={showCurrentPw ? 'text' : 'password'} {...passwordRegister('currentPassword')} className="pr-10" />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-mid)' }}>
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && <p className="text-sm" style={{ color: 'var(--red)' }}>{passwordErrors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Lock className="inline h-3 w-3 mr-1" /> New Password
              </Label>
              <div className="relative">
                <Input type={showNewPw ? 'text' : 'password'} {...passwordRegister('newPassword')} className="pr-10" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-mid)' }}>
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && <p className="text-sm" style={{ color: 'var(--red)' }}>{passwordErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                <Lock className="inline h-3 w-3 mr-1" /> Confirm Password
              </Label>
              <div className="relative">
                <Input type={showConfirmPw ? 'text' : 'password'} {...passwordRegister('confirmPassword')} className="pr-10" />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-mid)' }}>
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && <p className="text-sm" style={{ color: 'var(--red)' }}>{passwordErrors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Changing…' : 'Change Password'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="fade-up d2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" style={{ color: 'var(--teal-3)' }} />
            Update Fullname
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFullnameSubmit(onSubmitFullname)} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>Current Fullname</Label>
              <Input value={user?.fullname || ''} readOnly style={{ background: 'rgba(2, 6, 8, 0.6)', cursor: 'not-allowed' }} />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>New Fullname</Label>
              <Input {...fullnameRegister('fullname')} />
              {fullnameErrors.fullname && <p className="text-sm" style={{ color: 'var(--red)' }}>{fullnameErrors.fullname.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={fullnameLoading}>{fullnameLoading ? 'Updating…' : 'Update Fullname'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="fade-up d3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" style={{ color: 'var(--teal-3)' }} />
            Telegram Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
              <AtSign className="inline h-3 w-3 mr-1" /> Contact Username
            </Label>
            <Input value={telegramContact} onChange={e => setTelegramContact(e.target.value)} placeholder="// e.g. @CanKillYouForever" />
            <p className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
              {'// shown in key error messages (incorrect key, expired, suspended, etc.)'}
            </p>
          </div>
          <Button onClick={onSubmitTelegram} disabled={telegramLoading}>{telegramLoading ? 'Saving…' : 'Save Telegram Contact'}</Button>
        </CardContent>
      </Card>

      <Card className="fade-up d4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: 'var(--gold)' }} />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: 'rgba(20, 184, 184, 0.04)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(38, 165, 228, 0.12)', border: '1px solid rgba(38, 165, 228, 0.3)' }}
              >
                <MessageCircle className="h-5 w-5" style={{ color: '#26A5E4' }} />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-hi)' }}>Telegram</p>
                {user?.telegramId
                  ? <p className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>@{user.telegramUsername || user.telegramId}</p>
                  : <p className="text-xs" style={{ color: 'var(--text-lo)' }}>Not connected</p>}
              </div>
            </div>
            {user?.telegramId ? (
              user.level === 1 && <Button variant="destructive" size="sm" onClick={onDisconnectTelegram} disabled={disconnectLoading}>{disconnectLoading ? 'Disconnecting…' : 'Disconnect'}</Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.setItem('telegram_auth_mode', 'connect');
                  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
                  const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                  window.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}/auth/telegram/callback&request_access=write`;
                }}
              >
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
