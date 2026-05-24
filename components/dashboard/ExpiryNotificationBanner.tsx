'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, ChevronRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExpiringKey { _id: string; game: string; userKey: string; expiredDate: string; registrator: string; isFreeKey: boolean; }

export default function ExpiryNotificationBanner() {
  const router = useRouter();
  const [keys, setKeys] = useState<ExpiringKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/keys/expiring?hours=72')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data?.length > 0) {
          setKeys(result.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || dismissed || keys.length === 0) return null;

  const hoursLeft = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const h = Math.ceil(diff / (1000 * 60 * 60));
    if (h <= 0) return 'Expired';
    if (h < 24) return `${h}h left`;
    return `${Math.ceil(h / 24)}d left`;
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/40 via-orange-500/30 to-red-500/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <Card className="relative border-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 backdrop-blur-sm shadow-lg shadow-amber-500/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0 mt-0.5">
                <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-40 animate-pulse" style={{ animationDuration: '2s' }} />
                <AlertTriangle className="relative h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-amber-200">
                  {keys.length} key{keys.length > 1 ? 's' : ''} expiring soon
                </p>
                <div className="mt-2 space-y-1.5">
                  {keys.slice(0, 3).map((key) => (
                    <div key={key._id} className="flex items-center gap-2 text-xs text-muted-foreground/80">
                      <Clock className="h-3 w-3 text-amber-400/60" />
                      <span className="uppercase font-mono text-amber-300/80">{key.game}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="font-mono">{key.userKey.slice(0, 6)}…</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className={hoursLeft(key.expiredDate).includes('h') ? 'text-red-400 font-medium' : 'text-amber-400/80'}>
                        {hoursLeft(key.expiredDate)}
                      </span>
                    </div>
                  ))}
                  {keys.length > 3 && (
                    <p className="text-xs text-muted-foreground/60">+{keys.length - 3} more</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => router.push('/keys')} className="border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-300 transition-all">
                View Keys <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissed(true)} className="text-muted-foreground/60 hover:text-foreground hover:bg-background/50">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
