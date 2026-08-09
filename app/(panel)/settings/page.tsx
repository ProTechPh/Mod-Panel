'use client';

import { useState } from 'react';
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
import { Eye, EyeOff, User, KeyRound, Lock, Terminal, Shield, Award, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullnameLoading, setFullnameLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

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

  if (!user) return <p className="text-muted-foreground">Loading…</p>;

  const levelLabel = user.level === 1 ? 'Owner' : user.level === 2 ? 'Admin' : 'Reseller';
  
  const levelBadge = user.level === 1
    ? { bg: 'rgba(234, 179, 8, 0.1)', text: 'var(--gold)', border: 'rgba(234, 179, 8, 0.25)' }
    : user.level === 2
    ? { bg: 'rgba(96, 165, 250, 0.1)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.25)' }
    : { bg: 'rgba(234, 88, 12, 0.1)', text: 'var(--teal-3)', border: 'rgba(234, 88, 12, 0.25)' };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account Preferences"
        title="SETTINGS"
        sub="Manage your password, identity, and operator credentials."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr] items-start">
        {/* Left Column: Operator Identity Badge */}
        <div className="panel fade-up d1">
          <div className="panel-head">
            <h2 className="panel-title">
              <Terminal size={14} className="text-orange-500" />
              <span>Operator Identity</span>
            </h2>
            <span className="panel-badge">PROFILE</span>
          </div>

          <div className="p-5 space-y-6">
            {/* Visual Passport Badge */}
            <div className="relative overflow-hidden rounded-lg border border-white/5 bg-gradient-to-b from-zinc-900/60 to-black/80 p-5 flex flex-col items-center text-center shadow-lg">
              <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
              
              {/* Monogram Photo */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-orange-500 font-display text-xl font-black text-white mb-3 shadow-md"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', boxShadow: '0 0 16px rgba(234, 88, 12, 0.3)' }}
              >
                {(user.fullname || user.username || '?').slice(0, 2).toUpperCase()}
              </div>

              <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">
                {user.fullname || user.username}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
                // {user.username}
              </span>

              {/* Security Clearance level badge */}
              <span
                className="mt-3 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest font-mono"
                style={{
                  background: levelBadge.bg,
                  color: levelBadge.text,
                  borderColor: levelBadge.border,
                }}
              >
                Clearance: {levelLabel}
              </span>
            </div>

            {/* Diagnostics Stats */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500 flex items-center gap-1"><Award size={12} /> Credit Balance</span>
                <span className="text-orange-500 font-bold">{user.saldo} CR</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500 flex items-center gap-1"><Shield size={12} /> Integrity Bypass</span>
                <StatusBadge status="success" withDot>Nominal</StatusBadge>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500 flex items-center gap-1"><Calendar size={12} /> Registry Level</span>
                <span className="text-white">Tier-{user.level} Reseller</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Forms */}
        <div className="space-y-5 fade-up d2">
          <Card>
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
                  {passwordErrors.currentPassword && <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>}
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
                  {passwordErrors.newPassword && <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword.message}</p>}
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
                  {passwordErrors.confirmPassword && <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Changing…' : 'Change Password'}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
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
                  <Input value={user.fullname || ''} readOnly className="cursor-not-allowed opacity-60" style={{ background: 'rgba(0, 0, 0, 0.2)' }} />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>New Fullname</Label>
                  <Input {...fullnameRegister('fullname')} />
                  {fullnameErrors.fullname && <p className="text-sm text-red-500 mt-1">{fullnameErrors.fullname.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={fullnameLoading}>{fullnameLoading ? 'Updating…' : 'Update Fullname'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
