'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, User, Smartphone, Link as LinkIcon } from 'lucide-react';

export default function RegisterStreamerPage() {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<{ username: string; level: number }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [formData, setFormData] = useState({
    key: '',
    tiktokUsername: '',
    streamerName: '',
    contact: '',
    registrator: '',
  });

  useEffect(() => {
    fetch('/api/tiktok-live-streamers/admins')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAdmins(data.data);
        }
      })
      .catch(() => toast.error('Failed to load admin list'))
      .finally(() => setLoadingAdmins(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tiktok-live-streamers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formData.key,
          tiktokUsername: formData.tiktokUsername,
          streamerName: formData.streamerName,
          contact: formData.contact,
          registrator: formData.registrator,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Streamer registered successfully!');
        setFormData({
          key: '',
          tiktokUsername: '',
          streamerName: '',
          contact: '',
          registrator: '',
        });
      } else {
        toast.error(data.error || 'Failed to register streamer');
      }
    } catch {
      toast.error('Failed to register streamer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold text-center">TikTok Live Streamer</CardTitle>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Register as a TikTok live streamer and get exclusive benefits
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="registrator">Admin Username *</Label>
              <Select
                value={formData.registrator}
                onValueChange={value => setFormData({ ...formData, registrator: value || '' })}
              >
                <SelectTrigger id="registrator" className="w-full" disabled={loadingAdmins}>
                  <SelectValue placeholder={loadingAdmins ? 'Loading admins...' : 'Select admin username'} />
                </SelectTrigger>
                <SelectContent>
                  {admins.map(admin => (
                    <SelectItem key={admin.username} value={admin.username}>
                      {admin.username} {admin.level === 1 ? '(Owner)' : '(Admin)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="key">Your License Key *</Label>
              <div className="relative">
                <Input
                  id="key"
                  type="text"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  placeholder="Enter your license key"
                  className="pl-10"
                  required
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tiktokUsername">TikTok Username *</Label>
              <div className="relative">
                <Input
                  id="tiktokUsername"
                  type="text"
                  value={formData.tiktokUsername}
                  onChange={e => setFormData({ ...formData, tiktokUsername: e.target.value })}
                  placeholder="@yourusername"
                  className="pl-10"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your TikTok username (e.g., @johnDoe)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="streamerName">Display Name *</Label>
              <div className="relative">
                <Input
                  id="streamerName"
                  type="text"
                  value={formData.streamerName}
                  onChange={e => setFormData({ ...formData, streamerName: e.target.value })}
                  placeholder="Your streaming name"
                  className="pl-10"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact Information *</Label>
              <div className="relative">
                <Input
                  id="contact"
                  type="text"
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Telegram username or phone number"
                  className="pl-10"
                  required
                />
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll use this to notify you about your key status
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                'Register as Streamer'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By registering, you agree to our terms and conditions. Admin has auto-extend enabled for your key.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
