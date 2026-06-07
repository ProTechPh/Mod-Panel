'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/shared/ThemeProvider';
import {
  Moon, Sun, ShoppingCart, Loader2, Gamepad2, Smartphone, Zap,
  ShieldCheck, Trophy, Sparkles, KeyRound, Star, ArrowRight, CreditCard, Tag, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradientOrbs } from '@/components/landing/GradientOrbs';
import { SparkleCanvas } from '@/components/landing/SparkleCanvas';
import { GrainOverlay } from '@/components/landing/GrainOverlay';
import { PageHeader } from '@/components/shared/PageHeader';

interface Store { storeName: string; storeDescription: string; }
interface Product { _id: string; game: string; label: string; duration: number | string; maxDevices: number; price: number; }

function formatDuration(duration: number | string): string {
  if (duration === 'lifetime') return 'Lifetime';
  if (duration === '1h') return '1 Hour';
  if (duration === '3h') return '3 Hours';
  if (typeof duration === 'number' || !isNaN(Number(duration))) {
    const num = Number(duration);
    if (num === 1) return '1 Day';
    if (num === 7) return '7 Days';
    if (num === 30) return '30 Days';
    if (num === 60) return '60 Days';
    if (num === 90) return '90 Days';
    return `${num} Days`;
  }
  return String(duration);
}

type DurationKind = 'lifetime' | 'hours' | 'short' | 'medium' | 'long';
function getDurationKind(duration: number | string): DurationKind {
  if (duration === 'lifetime') return 'lifetime';
  if (duration === '1h' || duration === '3h') return 'hours';
  if (typeof duration === 'number' || !isNaN(Number(duration))) {
    const num = Number(duration);
    if (num <= 7) return 'short';
    if (num <= 30) return 'medium';
    return 'long';
  }
  return 'medium';
}

const DURATION_STYLES: Record<DurationKind, { color: string; bg: string; border: string; iconColor: string; Icon: typeof Star }> = {
  lifetime: { color: 'var(--gold)',  bg: 'rgba(240, 192, 64, 0.1)',  border: 'rgba(240, 192, 64, 0.3)',  iconColor: 'var(--gold)',    Icon: Star },
  hours:    { color: 'var(--teal-3)', bg: 'rgba(20, 184, 184, 0.1)',  border: 'rgba(20, 184, 184, 0.3)',  iconColor: 'var(--teal-2)',  Icon: Activity },
  short:    { color: 'var(--ecto-green)', bg: 'rgba(57, 255, 20, 0.1)', border: 'rgba(57, 255, 20, 0.3)', iconColor: 'var(--ecto-green)', Icon: Zap },
  medium:   { color: 'var(--teal-3)', bg: 'rgba(20, 184, 184, 0.1)',  border: 'rgba(20, 184, 184, 0.3)',  iconColor: 'var(--teal-2)',  Icon: Tag },
  long:     { color: 'var(--gold)',  bg: 'rgba(240, 192, 64, 0.1)',  border: 'rgba(240, 192, 64, 0.3)',  iconColor: 'var(--gold)',    Icon: Trophy },
};

export default function StorePage() {
  const { registrator } = useParams<{ registrator: string }>();
  const { theme, toggleTheme } = useTheme();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch(`/api/store?registrator=${encodeURIComponent(registrator)}`),
          fetch(`/api/store/products?registrator=${encodeURIComponent(registrator)}`),
        ]);
        if (storeRes.ok) setStore(await storeRes.json());
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch { toast.error('Failed to load store'); }
      finally { setLoading(false); }
    })();
  }, [registrator]);

  const openBuyDialog = (product: Product) => { setSelectedProduct(product); setBuyerName(''); setDialogOpen(true); };

  const handlePurchase = async () => {
    if (!selectedProduct) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct._id, registrator, buyerName: buyerName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) window.location.href = data.checkoutUrl;
      else toast.error(data.error || 'Failed to create payment session');
    } catch { toast.error('Network error. Please try again.'); }
    finally { setPurchasing(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <GradientOrbs />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--teal-2)' }} />
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>{'// Loading Store…'}</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <GradientOrbs />
        <div className="relative z-10 text-center space-y-4">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <ShoppingCart className="h-10 w-10" style={{ color: 'var(--red)' }} />
          </div>
          <h1 className="font-display text-2xl font-black tracking-wide" style={{ color: 'var(--text-hi)' }}>Store Not Found</h1>
          <p className="font-mono text-xs" style={{ color: 'var(--text-mid)' }}>{'// This store is unavailable or doesn’t exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <GradientOrbs />
      <SparkleCanvas />
      <GrainOverlay />

      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(2, 6, 8, 0.7)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: 'var(--teal-2)' }} />
            <span className="font-display font-bold tracking-wide" style={{ color: 'var(--text-hi)' }}>{store.storeName}</span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10">
        <PageHeader
          eyebrow="Official Reseller"
          title={store.storeName.toUpperCase()}
          sub={store.storeDescription || 'Premium license keys — instant delivery after payment.'}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <span className="status-pill-active">
                <ShieldCheck className="h-3 w-3" /> Secure Checkout
              </span>
              <span className="status-pill-warning">
                <Zap className="h-3 w-3" /> Instant Delivery
              </span>
              <span className="status-pill-gold">
                <Trophy className="h-3 w-3" /> Premium Quality
              </span>
            </div>
          }
        />

        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              background: 'rgba(20, 184, 184, 0.04)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--ff-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-mid)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--ecto-green)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--ecto-green)' }} />
            </span>
            <span>Powered by <span style={{ color: 'var(--text-hi)', fontWeight: 700 }}>{registrator}</span></span>
          </div>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="empty-state">
              <div className="empty-icon-ring"><Gamepad2 size={26} /></div>
              <div className="empty-title">No Products Available</div>
              <div className="empty-sub">Check back later for new offers.</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }} />
              <div className="flex items-center gap-2 px-3">
                <Trophy className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                <span className="font-display text-lg font-black tracking-wide" style={{ color: 'var(--text-hi)' }}>Available Products</span>
                <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
              </div>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => {
                const durKind = getDurationKind(product.duration);
                const ds = DURATION_STYLES[durKind];
                return (
                  <div key={product._id} className="product-card fade-up">
                    <Card className="h-full flex flex-col overflow-hidden">
                      <CardContent className="p-5 flex flex-col flex-1 gap-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="key-chip">{product.game}</span>
                            <h3 className="font-display font-black tracking-wide text-base mt-2" style={{ color: 'var(--text-hi)' }}>{product.label}</h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                            style={{ background: ds.bg, border: `1px solid ${ds.border}` }}
                          >
                            <ds.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: ds.iconColor }} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: ds.color }}>
                              {formatDuration(product.duration)}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                            style={{ background: 'rgba(20, 184, 184, 0.05)', border: '1px solid var(--border)' }}
                          >
                            <Smartphone className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--teal-2)' }} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-mid)' }}>
                              {product.maxDevices} device{product.maxDevices > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="font-display text-3xl font-black tracking-tight"
                                 style={{ background: 'linear-gradient(135deg, var(--teal-3), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                ₱{product.price.toFixed(0)}
                              </p>
                              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-lo)' }}>PHP · one-time</p>
                            </div>
                          </div>
                          <Button className="w-full" onClick={() => openBuyDialog(product)}>
                            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Buy Now
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 text-center pb-6">
          <div className="flex items-center justify-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-mid)' }}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} />
              <span className="font-mono uppercase tracking-widest">Secured Payment</span>
            </div>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-lo)' }} />
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
              <span className="font-mono uppercase tracking-widest">Instant Delivery</span>
            </div>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-lo)' }} />
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" style={{ color: 'var(--teal-2)' }} />
              <span className="font-mono uppercase tracking-widest">24/7 Support</span>
            </div>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-lo)' }}>
            {'By purchasing, you agree to our '}
            <a href="/store-terms" target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: 'var(--teal-2)' }}>
              Terms of Service
            </a>
            .
          </p>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(20, 184, 184, 0.04)', border: '1px solid var(--border)' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--ecto-green)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--ecto-green)' }} />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
              Keys delivered instantly after payment
            </span>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" style={{ color: 'var(--teal-2)' }} /> Complete Purchase
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (() => {
            const durKind = getDurationKind(selectedProduct.duration);
            const ds = DURATION_STYLES[durKind];
            return (
              <div className="space-y-4 pt-1">
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(20, 184, 184, 0.04)', border: '1px solid var(--border)' }}
                >
                  <span className="key-chip">{selectedProduct.game}</span>
                  <p className="font-display font-bold tracking-wide text-sm" style={{ color: 'var(--text-hi)' }}>{selectedProduct.label}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-mid)' }}>
                    <span className="inline-flex items-center gap-1">
                      <ds.Icon className="h-3 w-3" style={{ color: ds.iconColor }} />
                      {formatDuration(selectedProduct.duration)}
                    </span>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-lo)' }} />
                    <span className="inline-flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      {selectedProduct.maxDevices} device{selectedProduct.maxDevices > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p
                    className="font-display text-2xl font-black tracking-tight mt-2"
                    style={{ background: 'linear-gradient(135deg, var(--teal-3), var(--teal-neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  >
                    ₱{selectedProduct.price.toFixed(0)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-mid)' }}>
                    Your Name <span className="font-normal normal-case" style={{ color: 'var(--text-lo)' }}>(optional)</span>
                  </Label>
                  <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="// e.g. Juan dela Cruz" />
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-lo)' }}>{'// used for order reference only'}</p>
                </div>

                <Button className="w-full" onClick={handlePurchase} disabled={purchasing}>
                  {purchasing
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Redirecting…</>
                    : <><ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Proceed to Pay ₱{selectedProduct.price.toFixed(0)}</>
                  }
                </Button>
                <p className="text-[10px] text-center font-mono" style={{ color: 'var(--text-lo)' }}>
                  {'// you will be redirected to a secure payment checkout page'}
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

