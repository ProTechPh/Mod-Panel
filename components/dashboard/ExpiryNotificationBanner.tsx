'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExpiringKey {
  _id: string;
  game: string;
  userKey: string;
  expiredDate: string;
  registrator: string;
  isFreeKey: boolean;
}

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
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {keys.length} key{keys.length > 1 ? 's' : ''} expiring soon
              </p>
              <div className="mt-2 space-y-1">
                {keys.slice(0, 3).map((key) => (
                  <div key={key._id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="uppercase font-mono">{key.game}</span>
                    <span>•</span>
                    <span>{key.userKey.slice(0, 6)}…</span>
                    <span>•</span>
                    <span className={hoursLeft(key.expiredDate).includes('h') ? 'text-destructive font-medium' : ''}>
                      {hoursLeft(key.expiredDate)}
                    </span>
                  </div>
                ))}
                {keys.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{keys.length - 3} more
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => router.push('/keys')}>
              View Keys <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
