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
import { Sparkles, Eye, EyeOff, User, Shield, KeyRound, Send } from 'lucide-react';

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
    try { const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await res.json(); if (res.ok) toast.success('Password changed successfully'); else toast.error(result.error || 'Failed to change password'); } catch { toast.error('Network error'); } finally { setLoading(false); }
  };

  const onDisconnectTelegram = async () => {
    setDisconnectLoading(true);
    try { const res = await fetch('/api/auth/telegram/disconnect', { method: 'POST' }); const result = await res.json(); if (res.ok) { toast.success('Telegram account disconnected'); await refreshUser(); } else toast.error(result.error || 'Failed to disconnect Telegram'); } catch { toast.error('Network error'); } finally { setDisconnectLoading(false); }
  };

  const { register: fullnameRegister, handleSubmit: handleFullnameSubmit, formState: { errors: fullnameErrors } } = useForm<FullnameInput>({ resolver: zodResolver(fullnameSchema) });
  const onSubmitFullname = async (data: FullnameInput) => {
    setFullnameLoading(true);
    try { const res = await fetch('/api/users/update-fullname', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullname: data.fullname }) }); const result = await res.json(); if (res.ok) { toast.success('Fullname updated successfully'); await refreshUser(); } else toast.error(result.error || 'Failed to update fullname'); } catch { toast.error('Network error'); } finally { setFullnameLoading(false); }
  };

  const cardClass = "border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5";
  const cardHeaderGrad = "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Settings</h2>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>

      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className={cardHeaderGrad} />
          <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-purple-400" />Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Current Password</Label>
                <div className="relative">
                  <Input type={showCurrentPw ? 'text' : 'password'} {...passwordRegister('currentPassword')} className="bg-background/60 border-border/50 pr-10" />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {passwordErrors.currentPassword && <p className="text-sm text-red-400">{passwordErrors.currentPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Input type={showNewPw ? 'text' : 'password'} {...passwordRegister('newPassword')} className="bg-background/60 border-border/50 pr-10" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {passwordErrors.newPassword && <p className="text-sm text-red-400">{passwordErrors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Input type={showConfirmPw ? 'text' : 'password'} {...passwordRegister('confirmPassword')} className="bg-background/60 border-border/50 pr-10" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {passwordErrors.confirmPassword && <p className="text-sm text-red-400">{passwordErrors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className={cardHeaderGrad} />
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-fuchsia-400" />Update Fullname</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleFullnameSubmit(onSubmitFullname)} className="space-y-4">
              <div className="space-y-2"><Label className="text-muted-foreground">Current Fullname</Label><Input value={user?.fullname || ''} readOnly className="bg-muted/50" /></div>
              <div className="space-y-2"><Label className="text-muted-foreground">New Fullname</Label><Input {...fullnameRegister('fullname')} className="bg-background/60 border-border/50" />{fullnameErrors.fullname && <p className="text-sm text-red-400">{fullnameErrors.fullname.message}</p>}</div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25" disabled={fullnameLoading}>{fullnameLoading ? 'Updating...' : 'Update Fullname'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className={cardHeaderGrad} />
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-4 w-4 text-cyan-400" />Telegram Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Contact Username</Label>
              <Input value={telegramContact} onChange={e => setTelegramContact(e.target.value)} placeholder="e.g., @CanKillYouForever" className="bg-background/60 border-border/50" />
              <p className="text-xs text-muted-foreground/60">Shown to users in key error messages (incorrect key, expired, suspended, etc.)</p>
            </div>
            <Button onClick={onSubmitTelegram} disabled={telegramLoading} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">{telegramLoading ? 'Saving...' : 'Save Telegram Contact'}</Button>
          </CardContent>
        </Card>
      </div>

      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <Card className="relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5">
          <div className={cardHeaderGrad} />
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-purple-400" />Connected Accounts</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#26A5E4]/10 flex items-center justify-center">
                  <svg className="h-5 w-5 text-[#26A5E4]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <div>
                  <p className="font-medium text-sm">Telegram</p>
                  {user?.telegramId ? <p className="text-xs text-muted-foreground/70">@{user.telegramUsername || user.telegramId}</p> : <p className="text-xs text-muted-foreground/70">Not connected</p>}
                </div>
              </div>
              {user?.telegramId ? (
                user.level === 1 && <Button variant="destructive" size="sm" onClick={onDisconnectTelegram} disabled={disconnectLoading} className="h-8">{disconnectLoading ? 'Disconnecting...' : 'Disconnect'}</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { sessionStorage.setItem('telegram_auth_mode', 'connect'); const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID; const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin; window.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}/auth/telegram/callback&request_access=write`; }} className="border-border/50">Connect</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
