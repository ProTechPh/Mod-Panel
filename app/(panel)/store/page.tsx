'use client';

import { useEffect, useState } from 'react';
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
  ShoppingCart, Plus, Trash2, Pencil, Copy, Check,
  Package, Settings, ClipboardList, KeyRound, Loader2, TrendingUp, PhilippinePeso,
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
  createdAt: string;
}

const DURATION_OPTIONS = [
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
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

  // PayMongo (info only — keys are set via env vars)
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
      const duration: Duration = productForm.duration === '1h' || productForm.duration === '6h'
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Setup', icon: <Settings className="h-3.5 w-3.5" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Store</h2>
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
          <Card className="border-border/50">
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
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Store Description</Label>
                    <Textarea
                      value={storeForm.storeDescription}
                      onChange={e => setStoreForm({ ...storeForm, storeDescription: e.target.value })}
                      placeholder="Brief description shown to buyers..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={storeForm.isActive}
                      onCheckedChange={v => setStoreForm({ ...storeForm, isActive: v })}
                    />
                    <Label>Store Active (visible to buyers)</Label>
                  </div>
                  <Button onClick={saveStore} disabled={storeSaving} className="gap-2">
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
      )}

      {/* ── PRODUCTS TAB ──────────────────────────────────────── */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? 's' : ''}</p>
            <Dialog open={productDialog} onOpenChange={setProductDialog}>
              <DialogTrigger render={
                <Button size="sm" onClick={openAddProduct}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
              } />
              <DialogContent className="max-w-sm">
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
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Product Label</Label>
                    <Input
                      value={productForm.label}
                      onChange={e => setProductForm({ ...productForm, label: e.target.value })}
                      placeholder="e.g. CODM 1-Day Key"
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
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price (₱)</Label>
                      <Input
                        type="number" min={20} step={1}
                        value={productForm.price}
                        onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 20 })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum price is ₱20 (PayMongo requirement)</p>
                  <Button onClick={saveProduct} disabled={productSaving} className="w-full gap-2">
                    {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editProduct ? 'Save Changes' : 'Add Product'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {products.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No products yet. Add your first product above.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(p => (
                <Card key={p._id} className={`border-border/50 ${!p.isActive ? 'opacity-60' : ''}`}>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                      <PhilippinePeso className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">₱{revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{paid.length} paid order{paid.length !== 1 ? 's' : ''}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{orders.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-500">{orders.filter(o => o.status === 'pending').length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
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
            );
          })()}

          {ordersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No orders yet.</p>
              </CardContent>
            </Card>
          ) : (
            orders.map(o => (
              <Card key={o._id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {statusBadge(o.status)}
                        <Badge variant="outline" className="font-mono text-xs">{o.game}</Badge>
                        <span className="text-sm font-medium">{o.label}</span>
                      </div>
                      {o.buyerName && (
                        <p className="text-xs text-muted-foreground">Buyer: {o.buyerName}</p>
                      )}
                      {o.generatedKey && (
                        <div className="flex items-center gap-2 mt-1">
                          <KeyRound className="h-3.5 w-3.5 text-primary shrink-0" />
                          <code className="text-xs font-mono break-all text-muted-foreground">{o.generatedKey}</code>
                          <button onClick={() => copyKey(o.generatedKey!)} className="shrink-0 text-muted-foreground hover:text-foreground">
                            {copiedKey === o.generatedKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary">₱{o.price.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

    </div>
  );
}
