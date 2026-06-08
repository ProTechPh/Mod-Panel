'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2, Store, ArrowRight, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

interface StoreEntry {
  _id: string;
  registrator: string;
  storeName: string;
  storeDescription: string;
}

export default function MarketplacePage() {
  const [stores, setStores] = useState<StoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/store/marketplace');
        if (res.ok) {
          const data = await res.json();
          setStores(Array.isArray(data) ? data : []);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Browse"
        title="MARKETPLACE"
        highlight="STORES"
        sub="Browse all available stores and purchase premium keys."
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--teal-2)' }} />
        </div>
      )}

      {!loading && stores.length === 0 && (
        <Card>
          <CardContent className="empty-state">
            <div className="empty-icon-ring"><Store size={26} /></div>
            <div className="empty-title">No Stores Available</div>
            <div className="empty-sub">Check back later for new stores.</div>
          </CardContent>
        </Card>
      )}

      {!loading && stores.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map(s => (
            <Card key={s._id} className="h-full flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1 gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(20, 184, 184, 0.1)', border: '1px solid rgba(20, 184, 184, 0.25)' }}
                  >
                    <Store className="h-5 w-5" style={{ color: 'var(--teal-2)' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm truncate" style={{ color: 'var(--text-hi)' }}>{s.storeName}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-lo)' }}>@{s.registrator}</p>
                  </div>
                </div>
                {s.storeDescription && (
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-mid)' }}>{s.storeDescription}</p>
                )}
                <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <a href={`/${s.registrator}/store`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" /> Visit Store
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
