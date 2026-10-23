'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';

interface UserData {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  level: number;
  saldo: number;
  status: number;
  expirationDate: string;
}

export default function EditUserPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch(() => toast.error('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  if (authUser?.level !== 1) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <div className="state-icon state-icon--danger">
            <ShieldAlert aria-hidden className="size-6" />
          </div>
          <p className="state-eyebrow">Restricted</p>
          <h1 className="state-title">Access denied</h1>
          <p className="state-sub">User records can only be edited by the owner.</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!userData) return;
    setSaving(true);
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: userData.fullname,
        email: userData.email,
        level: userData.level,
        saldo: userData.saldo,
        status: userData.status,
        expirationDate: userData.expirationDate,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('User updated');
      router.replace('/admin/users');
    } else toast.error('Failed to update user');
  };

  if (loading || !userData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading-spinner" aria-label="Loading user" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        eyebrow="[ OPERATOR RECORD ]"
        title="Edit"
        highlight={userData.username}
        sub="Update credentials, clearance level, budget, and account status."
      />

      <Card>
        <CardContent className="space-y-4 pt-2">
          <div className="field">
            <Label className="field-label" htmlFor="user-fullname">
              Full name
            </Label>
            <Input
              id="user-fullname"
              value={userData.fullname}
              onChange={(e) => setUserData({ ...userData, fullname: e.target.value })}
            />
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="user-email">
              Email
            </Label>
            <Input
              id="user-email"
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            />
          </div>

          <div className="field">
            <Label className="field-label">Level</Label>
            <Select
              value={String(userData.level)}
              onValueChange={(v) => setUserData({ ...userData, level: Number(v) as 1 | 2 | 3 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Owner</SelectItem>
                <SelectItem value="2">Admin</SelectItem>
                <SelectItem value="3">Reseller</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="user-saldo">
              Budget
            </Label>
            <Input
              id="user-saldo"
              type="number"
              step="0.01"
              value={userData.saldo}
              onChange={(e) => setUserData({ ...userData, saldo: Number(e.target.value) })}
            />
          </div>

          <div className="field">
            <Label className="field-label">Status</Label>
            <Select
              value={String(userData.status)}
              onValueChange={(v) => setUserData({ ...userData, status: Number(v) as 1 | 2 | 3 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="2">Banned</SelectItem>
                <SelectItem value="3">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="field">
            <Label className="field-label" htmlFor="user-expiry">
              Expiration date
            </Label>
            <Input
              id="user-expiry"
              type="datetime-local"
              value={
                userData.expirationDate
                  ? new Date(userData.expirationDate).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) => setUserData({ ...userData, expirationDate: e.target.value })}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving && <Loader2 aria-hidden className="animate-spin" />}
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
