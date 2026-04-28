'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, ShoppingCart, Loader2, Gamepad2, Clock, Smartphone, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  if (duration === '1h') return '1 Hour';
  if (duration === '6h') return '6 Hours';
  if (typeof duration === 'number') {
    if (duration === 1) return '1 Day';
    if (duration === 7) return '7 Days';
    if (duration === 30) return '30 Days';
    return `${duration} Days`;
  }
  return String(duration);
}

function getDurationColor(duration: number | string): string {
  if (duration === '1h') return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (duration === '6h') return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
  if (duration === 1) return 'bg-green-500/15 text-green-400 border-green-500/30';
  if (duration === 7) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
}

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold">Store not found</h1>
          <p className="text-muted-foreground text-sm">This store is unavailable or doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="font-semibold">{store.storeName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{store.storeName}</h1>
          {store.storeDescription && (
            <p className="text-muted-foreground max-w-md mx-auto">{store.storeDescription}</p>
          )}
          <Badge variant="outline" className="text-xs">
            Powered by {registrator}
          </Badge>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <Gamepad2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No products available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Available Products</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => (
                <Card
                  key={product._id}
                  className="border-border/50 hover:border-primary/40 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs mb-2">
                          {product.game}
                        </Badge>
                        <CardTitle className="text-base leading-tight">{product.label}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getDurationColor(product.duration)}`}
                        >
                          {formatDuration(product.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Smartphone className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">{product.maxDevices} device{product.maxDevices > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">₱{product.price.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Philippine Peso</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openBuyDialog(product)}
                        className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Payments are processed securely via PayMongo.
          Keys are delivered instantly after payment confirmation.
        </p>
      </main>

      {/* Buy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 pt-1">
              {/* Product summary */}
              <div className="rounded-lg border border-border/50 bg-muted/40 p-4 space-y-2">
                <p className="font-medium text-sm">{selectedProduct.label}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{selectedProduct.game}</span>
                  <span>•</span>
                  <span>{formatDuration(selectedProduct.duration)}</span>
                  <span>•</span>
                  <span>{selectedProduct.maxDevices} device{selectedProduct.maxDevices > 1 ? 's' : ''}</span>
                </div>
                <p className="text-lg font-bold text-primary">₱{selectedProduct.price.toFixed(0)}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buyer-name">Your Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="buyer-name"
                  placeholder="e.g. Juan dela Cruz"
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Used for order reference only.</p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Redirecting to payment...</>
                  : <><ShoppingCart className="h-4 w-4" />Proceed to Pay ₱{selectedProduct.price.toFixed(0)}</>
                }
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You will be redirected to a secure PayMongo checkout page.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
