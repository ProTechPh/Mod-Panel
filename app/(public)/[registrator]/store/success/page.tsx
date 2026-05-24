'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toPng } from 'html-to-image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Copy, Check, Loader2, XCircle, Clock, KeyRound, ShoppingCart, RefreshCw, Download,
  Sparkles, Star, ShieldCheck, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ParticleField } from '@/components/landing/ParticleField';
import { SpotlightCursor } from '@/components/landing/SpotlightCursor';

type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

interface OrderData {
  _id: string;
  status: OrderStatus;
  generatedKey: string | null;
  game: string;
  label: string;
  price?: number;
  registrator: string;
  createdAt: string;
}

const MAX_POLLS = 24;
const POLL_INTERVAL_MS = 5000;

function SuccessContent({ registrator }: { registrator: string }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchOrder = useCallback(async (): Promise<OrderData | null> => {
    if (!orderId) return null;
    try {
      const res = await fetch(`/api/store/orders?orderId=${encodeURIComponent(orderId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetchOrder().then(data => {
      setOrder(data);
      setLoading(false);
      if (data?.status === 'pending') setPolling(true);
    });
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (!polling) return;
    if (pollCount >= MAX_POLLS) { setPolling(false); return; }
    const timer = setTimeout(async () => {
      const data = await fetchOrder();
      if (data) setOrder(data);
      if (data?.status !== 'pending') {
        setPolling(false);
      } else {
        setPollCount(c => c + 1);
      }
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [polling, pollCount, fetchOrder]);

  const handleCopy = () => {
    if (!order?.generatedKey) return;
    navigator.clipboard.writeText(order.generatedKey);
    setCopied(true);
    toast.success('Key copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || !order) return;
    try {
      const dataUrl = await toPng(receiptRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `receipt-${order._id.slice(-8)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Receipt image downloaded!');
    } catch {
      toast.error('Failed to download image.');
    }
  };

  const handleManualRefresh = async () => {
    const data = await fetchOrder();
    if (data) {
      setOrder(data);
      if (data.status !== 'pending') setPolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="sc-orb sc-orb-1" />
          <div className="sc-orb sc-orb-2" />
          <div className="sc-orb sc-orb-3" />
        </div>
        <div className="sc-grain" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="sc-orb sc-orb-1" />
          <div className="sc-orb sc-orb-2" />
          <div className="sc-orb sc-orb-3" />
        </div>
        <div className="sc-grain" />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 backdrop-blur-sm p-8 text-center space-y-4" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-black">Order not found</h1>
          <p className="text-sm text-muted-foreground">The order ID is invalid or has expired.</p>
          <Link href={`/${registrator}/store`}>
            <Button variant="outline" className="gap-2 font-bold">
              <ShoppingCart className="h-4 w-4" /> Back to Store
            </Button>
          </Link>
        </div>
        <style>{successStyles}</style>
      </div>
    );
  }

  const statusIcon = () => {
    if (order.status === 'paid') return <CheckCircle2 className="h-8 w-8 text-green-500" />;
    if (order.status === 'failed') return <XCircle className="h-8 w-8 text-destructive" />;
    return <Clock className="h-8 w-8 text-amber-500" />;
  };

  const statusBg = () => {
    if (order.status === 'paid') return 'bg-green-500/15 border-green-500/30';
    if (order.status === 'failed') return 'bg-destructive/15 border-destructive/30';
    return 'bg-amber-500/15 border-amber-500/30';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="sc-orb sc-orb-1" />
        <div className="sc-orb sc-orb-2" />
        <div className="sc-orb sc-orb-3" />
      </div>

      {/* Grain overlay */}
      <div className="sc-grain" />

      {/* Particles */}
      <ParticleField />

      {/* Spotlight */}
      <SpotlightCursor />

      <div className="relative z-10 w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {/* Main card */}
        <div className="rounded-2xl border border-border/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/20" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.03))' }}>
          {/* Header */}
          <div className="p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className={cn("w-16 h-16 rounded-full border flex items-center justify-center", statusBg())}>
                {statusIcon()}
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                {order.status === 'paid' && 'Payment Successful!'}
                {order.status === 'failed' && 'Payment Failed'}
                {order.status === 'pending' && 'Awaiting Payment'}
                {order.status === 'expired' && 'Payment Expired'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {order.status === 'paid' && 'Your key has been generated. Keep it safe!'}
                {order.status === 'failed' && 'Your payment could not be processed.'}
                {order.status === 'pending' && 'Waiting for payment confirmation...'}
                {order.status === 'expired' && 'This payment session has expired.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {order.status === 'paid' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border animate-pulse" style={{ background: 'hsla(145, 70%, 50%, 0.08)', borderColor: 'hsla(145, 70%, 50%, 0.2)', color: 'hsl(145, 70%, 45%)' }}>
                  <ShieldCheck className="size-3" /> Verified
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'hsla(250, 70%, 60%, 0.08)', borderColor: 'hsla(250, 70%, 60%, 0.2)', color: 'hsl(250, 70%, 60%)' }}>
                <KeyRound className="size-3" /> Order #{order._id.slice(-8)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            {/* Order details */}
            <div className="rounded-xl border border-border/40 p-4 space-y-3" style={{ background: 'var(--glass-bg, oklch(0.5 0 0 / 0.04))' }}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Product</span>
                <span className="font-bold">{order.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Game</span>
                <Badge variant="outline" className="font-mono text-xs font-bold">{order.game}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Order ID</span>
                <span className="font-mono text-xs text-muted-foreground font-bold">{order._id.slice(-8)}</span>
              </div>
            </div>

            {/* Generated key */}
            {order.status === 'paid' && order.generatedKey && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">Your Key</p>
                </div>
                <div className="rounded-xl border border-primary/30 p-4 relative overflow-hidden group" style={{ background: 'color-mix(in oklch, hsl(var(--primary)) 5%, transparent)' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 30px hsla(145, 70%, 50%, 0.05)' }} />
                  <p className="font-mono text-sm break-all select-all text-center font-bold tracking-wider relative z-10">
                    {order.generatedKey}
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button onClick={handleCopy} className="flex-1 gap-2 font-bold" variant={copied ? 'outline' : 'default'}>
                    {copied
                      ? <><Check className="h-4 w-4 text-green-500" />Copied!</>
                      : <><Copy className="h-4 w-4" />Copy Key</>
                    }
                  </Button>
                  <Button onClick={handleDownloadReceipt} className="flex-1 gap-2 font-bold" variant="outline">
                    <Download className="h-4 w-4" />Receipt
                  </Button>
                </div>
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">Save this key now — it won&apos;t be shown again after you leave.</span>
                </div>
              </div>
            )}

            {/* Pending state */}
            {order.status === 'pending' && (
              <div className="space-y-3 text-center">
                {polling && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Checking payment status...</span>
                  </div>
                )}
                {!polling && pollCount >= MAX_POLLS && (
                  <p className="text-sm text-muted-foreground font-medium">
                    Payment is taking longer than expected. Refresh manually or contact the store.
                  </p>
                )}
                <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2 font-bold">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh Status
                </Button>
              </div>
            )}

            {/* Failed / Expired */}
            {(order.status === 'failed' || order.status === 'expired') && (
              <p className="text-sm text-muted-foreground text-center font-medium">
                Please try again or contact <strong className="text-foreground">{registrator}</strong> for assistance.
              </p>
            )}

            {/* Back button */}
            <Link href={`/${registrator}/store`}>
              <Button variant={order.status === 'paid' ? 'outline' : 'default'} className="w-full gap-2 font-bold">
                <ShoppingCart className="h-4 w-4" />
                {order.status === 'paid' ? 'Back to Store' : 'Try Again'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden GCash-style Receipt Template */}
      <div className="fixed left-[-9999px] top-[-9999px]">
        <div ref={receiptRef} className="w-[380px] bg-white text-black p-8 rounded-2xl shadow-xl font-sans relative overflow-hidden" style={{ minHeight: '550px' }}>
          <div className="text-center space-y-2 mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-[#0051e5] rounded-full flex items-center justify-center mb-4 shadow-md">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-[22px] font-bold text-[#0051e5]">Transaction Receipt</h2>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>

          <div className="text-center mb-8 relative z-10">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Amount Paid</p>
            <p className="text-[40px] font-extrabold text-gray-900 tracking-tight leading-none">₱{order.price?.toFixed(2) || '0.00'}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-100">
              <CheckCircle2 className="h-4 w-4" /> Successful
            </div>
          </div>

          <div className="space-y-4 border-t-2 border-dashed border-gray-200 pt-6 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Store Name</span>
              <span className="font-semibold text-gray-900">{registrator}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Product</span>
              <span className="font-semibold text-gray-900">{order.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Game</span>
              <span className="font-semibold text-gray-900">{order.game}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Order ID</span>
              <span className="font-mono text-sm font-medium text-gray-700">{order._id.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          <div className="mt-10 text-center relative z-10">
            <p className="text-[13px] text-gray-500 font-medium">Thank you for your purchase!</p>
            <p className="text-[11px] text-gray-400 mt-2 font-mono">Ref No. {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          </div>

          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0051e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
      </div>

      <style>{successStyles}</style>
    </div>
  );
}

export default function StoreSuccessPage() {
  const { registrator } = useParams<{ registrator: string }>();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="sc-orb sc-orb-1" />
          <div className="sc-orb sc-orb-2" />
          <div className="sc-orb sc-orb-3" />
        </div>
        <div className="sc-grain" />
        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
      </div>
    }>
      <SuccessContent registrator={registrator} />
    </Suspense>
  );
}

const successStyles = `
  @keyframes sc-orb-drift-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -50px) scale(1.08); }
    50% { transform: translate(-20px, 20px) scale(0.92); }
    75% { transform: translate(40px, 30px) scale(1.05); }
  }
  @keyframes sc-orb-drift-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(-40px, 30px) scale(0.92); }
    50% { transform: translate(20px, -40px) scale(1.08); }
    75% { transform: translate(-30px, -20px) scale(1); }
  }
  @keyframes sc-orb-drift-3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(50px, 20px) scale(0.88); }
    66% { transform: translate(-30px, -40px) scale(1.12); }
  }
  .sc-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    will-change: transform;
    pointer-events: none;
    transition: opacity 0.5s;
  }
  .sc-orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, oklch(0.5 0.3 270), oklch(0.4 0.2 300));
    top: -20%; right: -10%;
    opacity: 0.12;
    animation: sc-orb-drift-1 22s ease-in-out infinite;
  }
  :root:not(.dark) .sc-orb-1 { opacity: 0.06; }
  .sc-orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, oklch(0.65 0.25 200), oklch(0.5 0.2 180));
    bottom: -10%; left: -10%;
    opacity: 0.1;
    animation: sc-orb-drift-2 25s ease-in-out infinite;
  }
  :root:not(.dark) .sc-orb-2 { opacity: 0.05; }
  .sc-orb-3 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, oklch(0.4 0.25 300), oklch(0.35 0.2 330));
    top: 50%; left: 50%;
    opacity: 0.08;
    animation: sc-orb-drift-3 18s ease-in-out infinite;
  }
  :root:not(.dark) .sc-orb-3 { opacity: 0.04; }
  .sc-grain {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.02;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }
  :root.dark .sc-grain { opacity: 0.035; }
  @media (prefers-reduced-motion: reduce) {
    .sc-orb { animation: none; }
  }
`;
