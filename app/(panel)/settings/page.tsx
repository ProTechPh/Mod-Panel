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
import { Eye, EyeOff, User, KeyRound, Lock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

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

    </div>
  );
}
