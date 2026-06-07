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
  ShoppingCart, Plus, Trash2, Pencil, Copy, Check, CheckCircle2,
  Package, Settings, ClipboardList, KeyRound, Loader2, TrendingUp, PhilippinePeso, Download,
} from 'lucide-react';
import type { Duration } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

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
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
  { label: 'Lifetime', value: 'lifetime' },
];

function durationLabel(d: Duration) {
  const found = DURATION_OPTIONS.find(o => o.value === d || String(o.value) === String(d));
  return found?.label ?? String(d);
}

function statusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
    expired: 'neutral',
  };
  return (
    <StatusBadge status={map[status] ?? 'neutral'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </StatusBadge>
  );
}

export default function StorePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('setup');

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

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  if (!user || (user.level !== 1 && user.level !== 2)) {
    return <p style={{ color: 'var(--text-mid)' }}>Access denied</p>;
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
      const duration: Duration = productForm.duration === '1h' || productForm.duration === '3h' || productForm.duration === 'lifetime'
        ? productForm.duration as Duration
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Setup', icon: <Settings className="h-3.5 w-3.5" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Public Storefront"
        title="STORE"
        highlight="MANAGER"
        sub="Branding, products, and live orders for your public store."
        actions={store && (
          <Button variant="outline" size="sm" onClick={copyStoreLink} className="gap-1.5">
            {copiedLink ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-3.5 w-3.5" />}
            Copy Store Link
          </Button>
        )}
      />

      <div className="flex rounded-lg border overflow-hidden w-fit" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              fontFamily: 'var(--ff-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: tab === t.id ? 'rgba(20, 184, 184, 0.12)' : 'transparent',
              color: tab === t.id ? 'var(--teal-3)' : 'var(--text-mid)',
              borderRight: '1px solid var(--border)',
              boxShadow: tab === t.id ? 'inset 0 0 0 1px rgba(20, 184, 184, 0.35), 0 0 14px rgba(20, 184, 184, 0.2)' : 'none',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'setup' && (
        <div className="space-y-4 max-w-xl">
          <Card className="fade-up d1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
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
                  <Button onClick={saveStore} disabled={storeSaving} className="gap-2">
                    {storeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save Store Settings
                  </Button>

                  {store && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-xs mb-1" style={{ color: 'var(--text-mid)' }}>Your public store URL:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs px-2 py-1 rounded flex-1 truncate" style={{ background: 'rgba(2, 6, 8, 0.6)', color: 'var(--text-mid)' }}>{storeLink}</code>
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

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-mid)' }}>{products.length} product{products.length !== 1 ? 's' : ''}</p>
            <Dialog open={productDialog} onOpenChange={setProductDialog}>
              <DialogTrigger render={
                <Button size="sm" onClick={openAddProduct}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
              } />
              <DialogContent className="max-w-sm border-border/30" style={{ background: 'rgba(9, 19, 24, 0.95)' }}>
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
                  <p className="text-xs" style={{ color: 'var(--text-mid)' }}>Minimum price is ₱20 (payment processor requirement)</p>
                  <Button onClick={saveProduct} disabled={productSaving} className="w-full gap-2">
                    {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editProduct ? 'Save Changes' : 'Add Product'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {products.length === 0 ? (
            <Card className="fade-up d1">
              <CardContent className="py-12 text-center">
                <Package className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-mid)' }} />
                <p style={{ color: 'var(--text-mid)' }}>No products yet. Add your first product above.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(p => (
                <Card key={p._id} className={`fade-up ${!p.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs mb-1">{p.game}</Badge>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-hi)' }}>{p.label}</p>
                      </div>
                      {!p.isActive && <Badge variant="secondary" className="text-xs shrink-0">Inactive</Badge>}
                    </div>
                    <div className="text-xs space-y-1" style={{ color: 'var(--text-mid)' }}>
                      <div className="flex justify-between">
                        <span>Duration</span><span>{durationLabel(p.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Devices</span><span>{p.maxDevices}</span>
                      </div>
                      <div className="flex justify-between font-semibold" style={{ color: 'var(--text-hi)' }}>
                        <span>Price</span><span style={{ color: 'var(--teal-2)' }}>₱{p.price.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => openEditProduct(p)}>
                        <Pencil className="h-3 w-3" />Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" style={{ color: 'var(--red)' }} onClick={() => deleteProduct(p._id)}>
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

      {tab === 'orders' && (
        <div className="space-y-4">
          {!ordersLoading && orders.length > 0 && (() => {
            const paid = orders.filter(o => o.status === 'paid');
            const revenue = paid.reduce((sum, o) => sum + o.price, 0);
            const convRate = orders.length > 0 ? Math.round((paid.length / orders.length) * 100) : 0;
            return (
              <div className="stat-row fade-up d1" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card panel-corner" style={{ '--card-accent': 'var(--teal-2)', '--icon-bg': 'rgba(20, 184, 184, 0.1)', '--icon-border': 'rgba(20, 184, 184, 0.2)', '--icon-glow': 'rgba(20, 184, 184, 0.3)' } as React.CSSProperties}>
                  <div className="stat-card-inner">
                    <div>
                      <div className="stat-val" style={{ color: 'var(--teal-2)' }}>₱{revenue.toLocaleString()}</div>
                      <div className="stat-lbl">Total Revenue</div>
                      <div className="stat-delta">{paid.length} paid order{paid.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="stat-icon-wrap" style={{ color: 'var(--teal-2)' }}><PhilippinePeso size={20} /></div>
                  </div>
                </div>
                <div className="stat-card panel-corner" style={{ '--card-accent': 'var(--ecto-green)', '--icon-bg': 'rgba(57, 255, 20, 0.08)', '--icon-border': 'rgba(57, 255, 20, 0.22)', '--icon-glow': 'rgba(57, 255, 20, 0.3)' } as React.CSSProperties}>
                  <div className="stat-card-inner">
                    <div>
                      <div className="stat-val" style={{ color: 'var(--ecto-green)' }}>{orders.length}</div>
                      <div className="stat-lbl">Total Orders</div>
                      <div className="stat-delta">All time</div>
                    </div>
                    <div className="stat-icon-wrap" style={{ color: 'var(--ecto-green)' }}><ClipboardList size={20} /></div>
                  </div>
                </div>
                <div className="stat-card panel-corner" style={{ '--card-accent': 'var(--gold)', '--icon-bg': 'rgba(240, 192, 64, 0.1)', '--icon-border': 'rgba(240, 192, 64, 0.22)', '--icon-glow': 'rgba(240, 192, 64, 0.3)' } as React.CSSProperties}>
                  <div className="stat-card-inner">
                    <div>
                      <div className="stat-val" style={{ color: 'var(--gold)' }}>{orders.filter(o => o.status === 'pending').length}</div>
                      <div className="stat-lbl">Pending</div>
                      <div className="stat-delta" style={{ color: 'var(--gold)', opacity: 0.7 }}>Awaiting payment</div>
                    </div>
                    <div className="stat-icon-wrap" style={{ color: 'var(--gold)' }}><KeyRound size={20} /></div>
                  </div>
                </div>
                <div className="stat-card panel-corner" style={{ '--card-accent': 'var(--teal-3)', '--icon-bg': 'rgba(94, 234, 212, 0.08)', '--icon-border': 'rgba(94, 234, 212, 0.22)', '--icon-glow': 'rgba(94, 234, 212, 0.3)' } as React.CSSProperties}>
                  <div className="stat-card-inner">
                    <div>
                      <div className="stat-val" style={{ color: 'var(--teal-3)' }}>{convRate}<span style={{ fontSize: '1rem', color: 'var(--text-mid)' }}>%</span></div>
                      <div className="stat-lbl">Conversion</div>
                      <div className="stat-delta">Paid vs total</div>
                    </div>
                    <div className="stat-icon-wrap" style={{ color: 'var(--teal-3)' }}><TrendingUp size={20} /></div>
                  </div>
                </div>
              </div>
            );
          })()}

          {ordersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <Card className="fade-up d1">
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-mid)' }} />
                <p style={{ color: 'var(--text-mid)' }}>No orders yet.</p>
              </CardContent>
            </Card>
          ) : (
            orders.map(o => (
              <Card key={o._id} className="fade-up d1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(o.status)}
                        <Badge variant="outline" className="font-mono text-xs">{o.game}</Badge>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-hi)' }}>{o.label}</span>
                        {user.level === 1 && o.registrator && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: 'var(--text-mid)', background: 'rgba(2, 6, 8, 0.6)' }}>{o.registrator}</span>
                        )}
                      </div>
                      {o.buyerName && (
                        <p className="text-xs" style={{ color: 'var(--text-mid)' }}>Buyer: {o.buyerName}</p>
                      )}
                      {o.generatedKey && (
                        <div className="flex items-center gap-2 mt-1">
                          <KeyRound className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--teal-2)' }} />
                          <code className="text-xs font-mono break-all" style={{ color: 'var(--text-mid)' }}>{o.generatedKey}</code>
                          <button onClick={() => copyKey(o.generatedKey!)} className="shrink-0 transition-colors" style={{ color: 'var(--text-mid)' }} title="Copy Key">
                            {copiedKey === o.generatedKey ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--ecto-green)' }} /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold" style={{ color: 'var(--teal-2)' }}>₱{o.price.toFixed(0)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-mid)' }}>{new Date(o.createdAt).toLocaleDateString()}</p>
                      {o.status !== 'paid' && (
                        <button
                          onClick={() => deleteOrder(o._id)}
                          className="mt-1 transition-colors"
                          style={{ color: 'var(--text-mid)' }}
                          title="Delete order"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
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
