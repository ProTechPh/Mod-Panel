'use client';

import { useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/components/shared/AuthProvider';
import { toast } from 'sonner';
import {
  ShoppingCart, Plus, Trash2, Pencil, Copy, Check, CheckCircle2,
  Package, Settings, ClipboardList, KeyRound, Loader2, TrendingUp, PhilippinePeso, Download, Sparkles,
} from 'lucide-react';
import type { Duration } from '@/types';

type Tab = 'setup' | 'products' | 'orders';

interface Store {
  storeName: string;
  storeDescription: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  game: string;
  label: string;
  duration: Duration;
  maxDevices: number;
  price: number;
  isActive: boolean;
}

interface Order {
  _id: string;
  label: string;
  game: string;
  price: number;
  status: string;
  generatedKey: string | null;
  buyerName: string;
  registrator: string;
  createdAt: string;
}

const DURATION_OPTIONS = [
  { label: '1 Hour', value: '1h' },
  { label: '3 Hours', value: '3h' },
  { label: '1 Day', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
];

function durationLabel(d: Duration) {
  const found = DURATION_OPTIONS.find(o => o.value === d || String(o.value) === String(d));
  return found?.label ?? String(d);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-green-500/15 text-green-400 border-green-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    failed: 'bg-destructive/15 text-destructive border-destructive/30',
    expired: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${map[status] ?? map.expired}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function StorePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('setup');

  // Setup
  const [store, setStore] = useState<Store | null>(null);
  const [storeForm, setStoreForm] = useState({ storeName: '', storeDescription: '', isActive: true });
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeLink, setStoreLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productDialog, setProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    game: '', label: '', duration: '1' as string, maxDevices: 1, price: 50,
  });
  const [productSaving, setProductSaving] = useState(false);
  const [gameCodes, setGameCodes] = useState<{ code: string; name: string }[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Payment Gateway (info only — keys are set via env vars)
  // PAYMONGO_SECRET_KEY, PAYMONGO_PUBLIC_KEY, PAYMONGO_WEBHOOK_SECRET

  useEffect(() => {
    if (!user || (user.level !== 1 && user.level !== 2)) return;
    setStoreLink(`${window.location.origin}/${user.username}/store`);

    fetch('/api/store')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setStore(data);
          setStoreForm({ storeName: data.storeName, storeDescription: data.storeDescription || '', isActive: data.isActive ?? true });
        }
      })
      .finally(() => setStoreLoading(false));

    fetch('/api/store/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));

    // Fetch user's configured game codes for the dropdown
    fetch('/api/game-settings?mine=true')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGameCodes(data.map((g: { gameCode: string; gameName: string }) => ({ code: g.gameCode, name: g.gameName })));
        }
      });
  }, [user]);

  useEffect(() => {
    if (tab === 'orders' && orders.length === 0) {
      setOrdersLoading(true);
      fetch('/api/store/orders')
        .then(r => r.json())
        .then(data => setOrders(Array.isArray(data) ? data : []))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab]);

  // Access control — must be after all hooks
  if (!user || (user.level !== 1 && user.level !== 2)) {
    return <p className="text-muted-foreground">Access denied</p>;
  }

  const saveStore = async () => {
    setStoreSaving(true);
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm),
      });
      if (res.ok) {
        const data = await res.json();
        setStore(data);
        toast.success('Store settings saved');
      } else {
        const e = await res.json();
        toast.error(e.error || 'Failed to save');
      }
    } finally {
      setStoreSaving(false);
    }
  };

  const copyStoreLink = () => {
    navigator.clipboard.writeText(storeLink);
    setCopiedLink(true);
    toast.success('Store link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openAddProduct = () => {
    setEditProduct(null);
    setProductForm({ game: '', label: '', duration: '1', maxDevices: 1, price: 50 });
    setProductDialog(true);
  };

  const openEditProduct = (p: Product) => {
    setEditProduct(p);
    setProductForm({
      game: p.game,
      label: p.label,
      duration: String(p.duration),
      maxDevices: p.maxDevices,
      price: p.price,
    });
    setProductDialog(true);
  };

  const saveProduct = async () => {
    setProductSaving(true);
    try {
      const duration: Duration = productForm.duration === '1h' || productForm.duration === '3h'
        ? productForm.duration
        : Number(productForm.duration);

      const body = editProduct
        ? { id: editProduct._id, ...productForm, duration }
        : { ...productForm, duration };

      const res = await fetch('/api/store/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (editProduct) {
          setProducts(prev => prev.map(p => p._id === data._id ? data : p));
          toast.success('Product updated');
        } else {
          setProducts(prev => [...prev, data]);
          toast.success('Product added');
        }
        setProductDialog(false);
      } else {
        const e = await res.json();
        toast.error(e.error || 'Failed to save product');
      }
    } finally {
      setProductSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const res = await fetch('/api/store/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _method: 'DELETE', id }),
    });
    if (res.ok) {
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted');
    } else toast.error('Failed to delete product');
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('Key copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/store/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o._id !== orderId));
        toast.success('Order deleted');
      } else {
        const e = await res.json();
        toast.error(e.error || 'Failed to delete order');
      }
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const downloadReceipt = async (o: Order) => {
    const cardEl = document.getElementById(`receipt-template-${o._id}`);
    if (!cardEl) return;
    
    try {
      const dataUrl = await toPng(cardEl, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `receipt-${o._id.slice(-8)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Receipt image downloaded!');
    } catch (err) {
      toast.error('Failed to download receipt image');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Setup', icon: <Settings className="h-3.5 w-3.5" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">Store</h2>
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        {store && (
          <Button variant="outline" size="sm" onClick={copyStoreLink} className="gap-1.5">
            {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Store Link
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border border-border/50 overflow-hidden w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SETUP TAB ─────────────────────────────────────────── */}
      {tab === 'setup' && (
        <div className="space-y-4 max-w-xl">
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Store Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storeLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>Store Name *</Label>
                      <Input
                        value={storeForm.storeName}
                        onChange={e => setStoreForm({ ...storeForm, storeName: e.target.value })}
                        placeholder="e.g. ProTech Key Shop"
                        className="bg-background/60 border-border/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Store Description</Label>
                      <Textarea
                        value={storeForm.storeDescription}
                        onChange={e => setStoreForm({ ...storeForm, storeDescription: e.target.value })}
                        placeholder="Brief description shown to buyers..."
                        rows={3}
                        className="bg-background/60 border-border/50"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={storeForm.isActive}
                        onCheckedChange={v => setStoreForm({ ...storeForm, isActive: v })}
                      />
                      <Label>Store Active (visible to buyers)</Label>
                    </div>
                    <Button onClick={saveStore} disabled={storeSaving} className="gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
                      {storeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save Store Settings
                    </Button>

                    {store && (
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-xs text-muted-foreground mb-1">Your public store URL:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{storeLink}</code>
                          <Button size="sm" variant="outline" onClick={copyStoreLink} className="shrink-0 h-7 text-xs gap-1">
                            {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ──────────────────────────────────────── */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? 's' : ''}</p>
            <Dialog open={productDialog} onOpenChange={setProductDialog}>
              <DialogTrigger render={
                <Button size="sm" onClick={openAddProduct} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25"><Plus className="h-4 w-4 mr-1" />Add Product</Button>
              } />
              <DialogContent className="max-w-sm border-border/30 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label>Game Code</Label>
                    {gameCodes.length > 0 ? (
                      <Select
                        value={productForm.game}
                        onValueChange={v => setProductForm({ ...productForm, game: v ?? '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select game" />
                        </SelectTrigger>
                        <SelectContent>
                          {gameCodes.map(g => (
                            <SelectItem key={g.code} value={g.code}>
                              <span className="font-mono text-xs mr-2 opacity-60">{g.code}</span>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={productForm.game}
                        onChange={e => setProductForm({ ...productForm, game: e.target.value.toUpperCase() })}
                        placeholder="e.g. CODM (no games configured yet)"
                        className="bg-background/60 border-border/50"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Product Label</Label>
                    <Input
                      value={productForm.label}
                      onChange={e => setProductForm({ ...productForm, label: e.target.value })}
                      placeholder="e.g. CODM 1-Day Key"
                      className="bg-background/60 border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration</Label>
                    <Select value={String(productForm.duration)} onValueChange={v => setProductForm({ ...productForm, duration: v ?? '1' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map(o => (
                          <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Max Devices</Label>
                      <Input
                        type="number" min={1}
                        value={productForm.maxDevices}
                        onChange={e => setProductForm({ ...productForm, maxDevices: parseInt(e.target.value) || 1 })}
                        className="bg-background/60 border-border/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price (₱)</Label>
                      <Input
                        type="number" min={20} step={1}
                        value={productForm.price}
                        onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 20 })}
                        className="bg-background/60 border-border/50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum price is ₱20 (payment processor requirement)</p>
                  <Button onClick={saveProduct} disabled={productSaving} className="w-full gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25">
                    {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editProduct ? 'Save Changes' : 'Add Product'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {products.length === 0 ? (
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                <CardContent className="py-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No products yet. Add your first product above.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(p => (
                <div key={p._id} className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                  <Card className={`relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden ${!p.isActive ? 'opacity-60' : ''}`}>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="font-mono text-xs mb-1">{p.game}</Badge>
                          <p className="font-medium text-sm">{p.label}</p>
                        </div>
                        {!p.isActive && <Badge variant="secondary" className="text-xs shrink-0">Inactive</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Duration</span><span>{durationLabel(p.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Devices</span><span>{p.maxDevices}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-foreground">
                          <span>Price</span><span className="text-primary">₱{p.price.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => openEditProduct(p)}>
                          <Pencil className="h-3 w-3" />Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteProduct(p._id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS TAB ────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {/* Analytics summary cards */}
          {!ordersLoading && orders.length > 0 && (() => {
            const paid = orders.filter(o => o.status === 'paid');
            const revenue = paid.reduce((sum, o) => sum + o.price, 0);
            const convRate = orders.length > 0 ? Math.round((paid.length / orders.length) * 100) : 0;
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                          <PhilippinePeso className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-primary">₱{revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{paid.length} paid order{paid.length !== 1 ? 's' : ''}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{orders.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">Pending</p>
                          <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-amber-500">{orders.filter(o => o.status === 'pending').length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">Conversion</p>
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-green-500">{convRate}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Paid vs total</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Per-reseller breakdown — Owner only */}
                {user.level === 1 && (() => {
                  const byRegistrator = orders.reduce<Record<string, { revenue: number; total: number; paid: number }>>((acc, o) => {
                    const r = o.registrator || 'Unknown';
                    if (!acc[r]) acc[r] = { revenue: 0, total: 0, paid: 0 };
                    acc[r].total++;
                    if (o.status === 'paid') { acc[r].paid++; acc[r].revenue += o.price; }
                    return acc;
                  }, {});
                  const rows = Object.entries(byRegistrator).sort((a, b) => b[1].revenue - a[1].revenue);
                  if (rows.length <= 1) return null;
                  return (
                    <div className="relative group">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                      <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Sales by Reseller
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">#</th>
                                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Reseller</th>
                                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Revenue</th>
                                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Paid</th>
                                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Total</th>
                                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Conv.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map(([reg, s], i) => (
                                  <tr key={reg} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                                    <td className="px-4 py-2 font-mono font-medium">{reg}</td>
                                    <td className="px-4 py-2 text-right text-primary font-semibold">₱{s.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right text-green-500">{s.paid}</td>
                                    <td className="px-4 py-2 text-right">{s.total}</td>
                                    <td className="px-4 py-2 text-right text-muted-foreground">{s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
              </>
            );
          })()}

          {ordersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders yet.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            orders.map(o => (
              <div key={o._id}>
                <div className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                  <Card className="relative border-0 bg-background/60 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {statusBadge(o.status)}
                            <Badge variant="outline" className="font-mono text-xs">{o.game}</Badge>
                            <span className="text-sm font-medium">{o.label}</span>
                            {user.level === 1 && o.registrator && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{o.registrator}</span>
                            )}
                          </div>
                          {o.buyerName && (
                            <p className="text-xs text-muted-foreground">Buyer: {o.buyerName}</p>
                          )}
                          {o.generatedKey && (
                            <div className="flex items-center gap-2 mt-1">
                              <KeyRound className="h-3.5 w-3.5 text-primary shrink-0" />
                              <code className="text-xs font-mono break-all text-muted-foreground">{o.generatedKey}</code>
                              <div className="receipt-actions flex items-center gap-2">
                                <button onClick={() => copyKey(o.generatedKey!)} className="shrink-0 text-muted-foreground hover:text-foreground" title="Copy Key">
                                  {copiedKey === o.generatedKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={() => downloadReceipt(o)} className="shrink-0 text-muted-foreground hover:text-foreground" title="Download Receipt">
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-primary">₱{o.price.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                          {o.status !== 'paid' && (
                            <button
                              onClick={() => deleteOrder(o._id)}
                              className="mt-1 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete order"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Hidden GCash-style Receipt Template */}
                <div className="fixed left-[-9999px] top-[-9999px]">
                  <div id={`receipt-template-${o._id}`} className="w-[380px] bg-white text-black p-8 rounded-2xl shadow-xl font-sans relative overflow-hidden" style={{ minHeight: '550px' }}>
                    <div className="text-center space-y-2 mb-8 relative z-10">
                      <div className="mx-auto w-16 h-16 bg-[#0051e5] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <Check className="h-8 w-8 text-white" strokeWidth={3} />
                      </div>
                      <h2 className="text-[22px] font-bold text-[#0051e5]">Transaction Receipt</h2>
                      <p className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>

                    <div className="text-center mb-8 relative z-10">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Amount Paid</p>
                      <p className="text-[40px] font-extrabold text-gray-900 tracking-tight leading-none">₱{o.price?.toFixed(2) || '0.00'}</p>
                      <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-100">
                        <CheckCircle2 className="h-4 w-4" /> Successful
                      </div>
                    </div>

                    <div className="space-y-4 border-t-2 border-dashed border-gray-200 pt-6 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Store Name</span>
                        <span className="font-semibold text-gray-900">{o.registrator || store?.storeName || 'Store'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Product</span>
                        <span className="font-semibold text-gray-900">{o.label}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Game</span>
                        <span className="font-semibold text-gray-900">{o.game}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Order ID</span>
                        <span className="font-mono text-sm font-medium text-gray-700">{o._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>



                    <div className="mt-10 text-center relative z-10">
                      <p className="text-[13px] text-gray-500 font-medium">Thank you for your purchase!</p>
                      <p className="text-[11px] text-gray-400 mt-2 font-mono">Ref No. {o._id.slice(-12).toUpperCase()}</p>
                    </div>

                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0051e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
