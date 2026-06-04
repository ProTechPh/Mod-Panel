'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/shared/ThemeProvider';
import {
  Moon, Sun, ShoppingCart, Loader2, Gamepad2, Clock, Smartphone, Zap,
  Sparkles, Star, ShieldCheck, ArrowRight, Timer, Trophy, Gem, KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ParticleField } from '@/components/landing/ParticleField';
import { SpotlightCursor } from '@/components/landing/SpotlightCursor';

interface Store {
  storeName: string;
  storeDescription: string;
}

interface Product {
  _id: string;
  game: string;
  label: string;
  duration: number | string;
  maxDevices: number;
  price: number;
}

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

function getDurationColor(duration: number | string): string {
  if (duration === 'lifetime') return 'from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/30 text-fuchsia-400';
  if (duration === '1h') return 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400';
  if (duration === '3h') return 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400';
  if (Number(duration) === 1) return 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400';
  if (Number(duration) === 7) return 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400';
  if (Number(duration) === 60) return 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400';
  if (Number(duration) === 90) return 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400';
  return 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400';
}

function getDurationIcon(duration: number | string) {
  if (duration === 'lifetime') return <Star className="h-3.5 w-3.5" />;
  if (duration === '1h' || duration === '3h') return <Clock className="h-3.5 w-3.5" />;
  return <Timer className="h-3.5 w-3.5" />;
}

export default function StorePage() {
  const { registrator } = useParams<{ registrator: string }>();
  const { theme, toggleTheme } = useTheme();
  const tiltRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const cards = tiltRefs.current.filter(Boolean) as HTMLDivElement[];
    const handlers: { el: HTMLDivElement; f: (e: MouseEvent) => void; l: (e: MouseEvent) => void }[] = [];

    cards.forEach(card => {
      const inner = card.querySelector('.store-tilt-inner') as HTMLElement;
      if (!inner) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        inner.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      };

      const handleMouseLeave = () => {
        inner.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
      handlers.push({ el: card, f: handleMouseMove, l: handleMouseLeave });
    });

    return () => {
      handlers.forEach(({ el, f, l }) => {
        el.removeEventListener('mousemove', f);
        el.removeEventListener('mouseleave', l);
      });
    };
  }, [products]);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch(`/api/store?registrator=${encodeURIComponent(registrator)}`),
          fetch(`/api/store/products?registrator=${encodeURIComponent(registrator)}`),
        ]);

        if (storeRes.ok) {
          setStore(await storeRes.json());
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch {
        toast.error('Failed to load store');
      } finally {
        setLoading(false);
      }
    };
    loadStore();
  }, [registrator]);

  const openBuyDialog = (product: Product) => {
    setSelectedProduct(product);
    setBuyerName('');
    setDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          registrator,
          buyerName: buyerName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || 'Failed to create payment session');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="store-orb store-orb-1" />
          <div className="store-orb store-orb-2" />
          <div className="store-orb store-orb-3" />
          <div className="store-orb store-orb-4" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Loading Store...</p>
        </div>
        <style>{storeStyles}</style>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="store-orb store-orb-1" />
          <div className="store-orb store-orb-2" />
          <div className="store-orb store-orb-3" />
          <div className="store-orb store-orb-4" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20">
            <ShoppingCart className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-black">Store not found</h1>
          <p className="text-muted-foreground text-sm">This store is unavailable or doesn&apos;t exist.</p>
        </div>
        <style>{storeStyles}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="store-orb store-orb-1" />
        <div className="store-orb store-orb-2" />
        <div className="store-orb store-orb-3" />
        <div className="store-orb store-orb-4" />
      </div>

      {/* Grain overlay */}
      <div className="store-grain" />

      {/* Particle field */}
      <ParticleField />

      {/* Spotlight cursor */}
      <SpotlightCursor />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="relative">
              <ShoppingCart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">{store.storeName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-[2] max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 group store-glow-card">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
            <ShoppingCart className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Star className="store-sparkle absolute -top-2 -right-2 h-3.5 w-3.5 text-amber-400" />
            <Star className="store-sparkle-delayed absolute -bottom-1 -left-2 h-2.5 w-2.5 text-primary/60" />
          </div>

          <div className="space-y-2">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground/60 store-title-shimmer">
                {store.storeName}
              </h1>
              <Sparkles className="store-sparkle absolute -top-2 -right-8 h-4 w-4 text-primary" />
              <Sparkles className="store-sparkle-delayed absolute -bottom-1 -left-8 h-3 w-3 text-amber-400" />
            </div>
            {store.storeDescription && (
              <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">{store.storeDescription}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border animate-pulse" style={{ background: 'hsla(145, 70%, 50%, 0.08)', borderColor: 'hsla(145, 70%, 50%, 0.2)', color: 'hsl(145, 70%, 45%)' }}>
              <ShieldCheck className="size-3" /> Secure Checkout
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'hsla(250, 70%, 60%, 0.08)', borderColor: 'hsla(250, 70%, 60%, 0.2)', color: 'hsl(250, 70%, 60%)' }}>
              <Zap className="size-3" /> Instant Delivery
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'hsla(30, 90%, 55%, 0.08)', borderColor: 'hsla(30, 90%, 55%, 0.2)', color: 'hsl(30, 90%, 50%)' }}>
              <Trophy className="size-3" /> Premium Quality
            </div>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.05))' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-muted-foreground font-medium">Powered by <span className="font-bold text-foreground">{registrator}</span></span>
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-border/50 backdrop-blur-sm py-16 text-center" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
            <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No products available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back later for new offers.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              <div className="flex items-center gap-2 px-4">
                <Gem className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Available Products</h2>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 store-sparkle" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <div
                  key={product._id}
                  ref={el => { tiltRefs.current[i] = el; }}
                  className="store-tilt-card group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="store-tilt-inner rounded-2xl border border-border/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 h-full flex flex-col"
                    style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
                    {/* Card header glow */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg, oklch(0.5 0.25 270 / 0.03), transparent)' }} />

                    {/* Top badge */}
                    <div className="relative z-10 px-5 pt-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider border bg-background/50">
                            {product.game}
                          </span>
                          <CardTitle className="text-base leading-tight mt-2 font-black">{product.label}</CardTitle>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <CardContent className="relative z-10 px-5 pb-5 space-y-4 flex flex-col flex-1">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {getDurationIcon(product.duration)}
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-md border font-bold bg-gradient-to-br",
                            getDurationColor(product.duration)
                          )}>
                            {formatDuration(product.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Smartphone className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-semibold">{product.maxDevices} device{product.maxDevices > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-2">
                        {/* Price */}
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">₱{product.price.toFixed(0)}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Philippine Peso</p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-muted-foreground font-medium">one-time</span>
                          </div>
                        </div>

                        {/* CTA */}
                        <Button
                          size="default"
                          onClick={() => openBuyDialog(product)}
                          className="group/btn relative w-full h-11 font-extrabold text-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />
                          <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/80 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Buy Now
                            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust footer */}
        <div className="space-y-4 text-center pb-6">
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              <span>Secured Payment</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Instant Delivery</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>24/7 Support</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            By purchasing, you agree to our{' '}
            <a href="/store-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Terms of Service
            </a>
            .
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Keys delivered instantly after payment</span>
          </div>
        </div>
      </main>

      {/* Buy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm border-border/50 backdrop-blur-xl" style={{ background: 'color-mix(in oklch, var(--background) 95%, transparent)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Complete Purchase
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 pt-1">
              {/* Product summary */}
              <div className="rounded-xl border border-border/50 p-4 space-y-3 relative overflow-hidden group" style={{ background: 'color-mix(in oklch, var(--muted) 50%, transparent)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px hsla(145, 70%, 50%, 0.04)' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{selectedProduct.game}</Badge>
                  </div>
                  <p className="font-bold text-sm">{selectedProduct.label}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      {getDurationIcon(selectedProduct.duration)}
                      {formatDuration(selectedProduct.duration)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="inline-flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      {selectedProduct.maxDevices} device{selectedProduct.maxDevices > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-primary mt-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">₱{selectedProduct.price.toFixed(0)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buyer-name" className="text-xs font-bold">Your Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="buyer-name"
                  placeholder="e.g. Juan dela Cruz"
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  className="border-border/50 focus:border-primary/30 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground font-medium">Used for order reference only.</p>
              </div>

              <Button
                className="group/btn relative w-full h-12 text-base font-extrabold overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/25 hover:shadow-primary/40"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />
                <span className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/80 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {purchasing
                    ? <><Loader2 className="h-5 w-5 animate-spin" />Redirecting to payment...</>
                    : <><ShoppingCart className="h-5 w-5" />Proceed to Pay ₱{selectedProduct.price.toFixed(0)}</>
                  }
                </span>
              </Button>
              <p className="text-[10px] text-center text-muted-foreground font-medium">
                You will be redirected to a secure payment checkout page.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{storeStyles}</style>
    </div>
  );
}

const storeStyles = `
  @keyframes store-orb-drift-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -50px) scale(1.08); }
    50% { transform: translate(-20px, 20px) scale(0.92); }
    75% { transform: translate(40px, 30px) scale(1.05); }
  }
  @keyframes store-orb-drift-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(-40px, 30px) scale(0.92); }
    50% { transform: translate(20px, -40px) scale(1.08); }
    75% { transform: translate(-30px, -20px) scale(1); }
  }
  @keyframes store-orb-drift-3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(50px, 20px) scale(0.88); }
    66% { transform: translate(-30px, -40px) scale(1.12); }
  }
  @keyframes store-orb-drift-4 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-20px, -30px) scale(1.06); }
  }
  @keyframes store-title-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes store-sparkle-float {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
    50% { transform: translateY(-8px) rotate(180deg); opacity: 1; }
  }
  @keyframes store-glow-pulse {
    0%, 100% { box-shadow: 0 0 8px oklch(0.5 0.25 270 / 0.1); }
    50% { box-shadow: 0 0 30px oklch(0.5 0.25 270 / 0.2), 0 0 60px oklch(0.6 0.2 200 / 0.1); }
  }
  .store-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    will-change: transform;
    pointer-events: none;
    transition: opacity 0.5s;
  }
  .store-orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, oklch(0.5 0.3 270), oklch(0.4 0.2 300));
    top: -20%; right: -15%;
    opacity: 0.15;
    animation: store-orb-drift-1 22s ease-in-out infinite;
  }
  :root:not(.dark) .store-orb-1 { opacity: 0.07; }
  .store-orb-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, oklch(0.65 0.25 200), oklch(0.5 0.2 180));
    bottom: -15%; left: -15%;
    opacity: 0.12;
    animation: store-orb-drift-2 25s ease-in-out infinite;
  }
  :root:not(.dark) .store-orb-2 { opacity: 0.06; }
  .store-orb-3 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, oklch(0.4 0.25 300), oklch(0.35 0.2 330));
    top: 40%; left: 60%;
    opacity: 0.1;
    animation: store-orb-drift-3 18s ease-in-out infinite;
  }
  :root:not(.dark) .store-orb-3 { opacity: 0.05; }
  .store-orb-4 {
    width: 250px; height: 250px;
    background: radial-gradient(circle, oklch(0.65 0.25 150), oklch(0.55 0.2 130));
    top: 15%; left: 20%;
    opacity: 0.09;
    animation: store-orb-drift-4 15s ease-in-out infinite;
  }
  :root:not(.dark) .store-orb-4 { opacity: 0.04; }
  .store-grain {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.02;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }
  :root.dark .store-grain { opacity: 0.035; }
  .store-title-shimmer {
    background-size: 200% auto;
    animation: store-title-shimmer 4s linear infinite;
  }
  .store-sparkle {
    animation: store-sparkle-float 3s ease-in-out infinite;
  }
  .store-sparkle-delayed {
    animation: store-sparkle-float 3s ease-in-out infinite;
    animation-delay: 1.5s;
  }
  .store-glow-card {
    animation: store-glow-pulse 3s ease-in-out infinite;
  }
  .store-tilt-card {
    perspective: 800px;
    transform-style: preserve-3d;
  }
  .store-tilt-inner {
    transform-style: preserve-3d;
    transition: transform 0.15s ease-out;
    position: relative;
  }
  @media (prefers-reduced-motion: reduce) {
    .store-orb { animation: none; }
    .store-title-shimmer { animation: none; }
    .store-sparkle, .store-sparkle-delayed { animation: none; }
    .store-glow-card { animation: none; }
    .store-tilt-inner { transition: none; }
  }
`;
