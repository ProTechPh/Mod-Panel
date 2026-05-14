'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStreamerAuth } from '@/components/shared/StreamerAuthProvider';
import { toast } from 'sonner';
import {
  Timer, Calendar, User, Smartphone,
  Radio, Play, Square, LogOut, Settings, Check, AlertCircle,
  Loader2
} from 'lucide-react';

export default function StreamerDashboardPage() {
  const router = useRouter();
  const { streamer, loading, setStreamer, refreshStreamer } = useStreamerAuth();
  const [isLive, setIsLive] = useState(false);
  const [liveStartTime, setLiveStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ streamerName: '', contact: '' });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !streamer) {
      router.push('/streamer/login');
    }
  }, [loading, streamer, router]);

  // Restore live state from streamer status on load/refresh
  useEffect(() => {
    if (streamer && streamer.status === 'active') {
      setIsLive(true);
      // Estimate start time from lastLive if available
      if (streamer.lastLive) {
        setLiveStartTime(new Date(streamer.lastLive));
      } else {
        setLiveStartTime(new Date());
      }
    }
  }, [streamer]);

  // Live timer
  useEffect(() => {
    if (!isLive || !liveStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - liveStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, liveStartTime]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!streamer) return null;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!streamer.keyExpiry) return { hours: 0, text: 'Unknown' };
    const now = Date.now();
    const expiry = new Date(streamer.keyExpiry).getTime();
    const diffMs = expiry - now;
    const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return {
      hours,
      text: days > 0 ? `${days}d ${remainingHours}h remaining` : `${hours}h remaining`,
      urgent: hours < 24,
    };
  };

  const timeRemaining = getTimeRemaining();

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      active: 'bg-green-500/15 text-green-400 border-green-500/30',
      inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
      expired: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const handleStartLive = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/streamer/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsLive(true);
        setLiveStartTime(new Date());
        setElapsedSeconds(0);
        toast.success('Live session started!');
        if (data.extended) toast.success('Key auto-extended by 7 days!');
        refreshStreamer();
      } else {
        toast.error(data.error || 'Failed to start live');
      }
    } catch {
      toast.error('Failed to start live session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndLive = async () => {
    const durationMinutes = Math.ceil(elapsedSeconds / 60);
    setActionLoading(true);
    try {
      const res = await fetch('/api/streamer/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', durationMinutes }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsLive(false);
        setLiveStartTime(null);
        setElapsedSeconds(0);
        toast.success(`Live ended! Duration: ${formatTime(durationMinutes)}`);
        refreshStreamer();
      } else {
        toast.error(data.error || 'Failed to end live');
      }
    } catch {
      toast.error('Failed to end live session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/streamer/auth/logout', { method: 'POST' });
    setStreamer(null);
    router.push('/streamer/login');
  };

  const openProfileDialog = () => {
    setProfileForm({
      streamerName: streamer.streamerName,
      contact: streamer.contact,
    });
    setShowProfileDialog(true);
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/streamer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profile updated!');
        setShowProfileDialog(false);
        refreshStreamer();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Streamer Panel</h1>
              <p className="text-xs text-muted-foreground">@{streamer.tiktokUsername}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={openProfileDialog}>
              <Settings className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Live Status Banner */}
        {isLive && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <p className="font-bold text-red-400">🔴 LIVE NOW</p>
                <p className="text-sm text-red-400/80 font-mono">{formatSeconds(elapsedSeconds)}</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleEndLive} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Square className="h-4 w-4 mr-1" />}
              End Live
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Key Status</CardTitle>
              <KeyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={statusColor(streamer.status)}>
                {streamer.status.charAt(0).toUpperCase() + streamer.status.slice(1)}
              </Badge>
              <p className={`text-xs mt-2 ${timeRemaining.urgent ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                {timeRemaining.text}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Live Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(streamer.liveDuration)}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time duration</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Live</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {streamer.lastLive ? (
                <>
                  <div className="text-lg font-bold">
                    {new Date(streamer.lastLive).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(streamer.lastLiveDuration)}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground italic text-sm">No sessions yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Extend</CardTitle>
              {streamer.autoExtendEnabled ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {streamer.autoExtendEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {streamer.autoExtendEnabled
                  ? 'Key extends when you go live'
                  : 'Contact admin to enable'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {!isLive && (
          <Card className="border-border/50">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Ready to go live?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start your live session to track your streaming time
                </p>
              </div>
              <Button
                size="lg"
                className="gap-2 px-8"
                onClick={handleStartLive}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                Start Live Session
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Streamer Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{streamer.streamerName}</p>
                <p className="text-xs text-muted-foreground">Display Name</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">@{streamer.tiktokUsername}</p>
                <p className="text-xs text-muted-foreground">TikTok Username</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{streamer.contact}</p>
                <p className="text-xs text-muted-foreground">Contact</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KeyIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-mono">{streamer.key}</p>
                <p className="text-xs text-muted-foreground">License Key</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                value={profileForm.streamerName}
                onChange={e => setProfileForm({ ...profileForm, streamerName: e.target.value })}
                placeholder="Your streaming name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Input
                value={profileForm.contact}
                onChange={e => setProfileForm({ ...profileForm, contact: e.target.value })}
                placeholder="Telegram or phone number"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple key icon component
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
