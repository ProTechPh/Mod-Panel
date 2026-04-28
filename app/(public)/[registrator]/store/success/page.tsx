'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toPng } from 'html-to-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Copy, Check, Loader2, XCircle, Clock, KeyRound, ShoppingCart, RefreshCw, Download
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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

const MAX_POLLS = 24; // 2 minutes max (24 × 5s)
const POLL_INTERVAL_MS = 5000;

// ── Inner component that uses useSearchParams ─────────────────────────────
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

  // Initial load
  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetchOrder().then(data => {
      setOrder(data);
      setLoading(false);
      if (data?.status === 'pending') setPolling(true);
    });
  }, [orderId, fetchOrder]);

  // Polling loop
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
        backgroundColor: '#ffffff', // White background for the receipt
        pixelRatio: 2, // High resolution
      });

      const link = document.createElement('a');
      link.download = `receipt-${order._id.slice(-8)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Receipt image downloaded!');
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/50 text-center">
          <CardContent className="py-12 space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Order not found</h1>
            <p className="text-sm text-muted-foreground">The order ID is invalid or has expired.</p>
            <Link href={`/${registrator}/store`}>
              <Button variant="outline"><ShoppingCart className="h-4 w-4 mr-2" />Back to Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-3">
            {order.status === 'paid' ? (
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            ) : order.status === 'failed' ? (
              <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl">
            {order.status === 'paid' && 'Payment Successful!'}
            {order.status === 'failed' && 'Payment Failed'}
            {order.status === 'pending' && 'Awaiting Payment'}
            {order.status === 'expired' && 'Payment Expired'}
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            {order.status === 'paid' && 'Your key has been generated. Keep it safe!'}
            {order.status === 'failed' && 'Your payment could not be processed.'}
            {order.status === 'pending' && 'Waiting for payment confirmation...'}
            {order.status === 'expired' && 'This payment session has expired.'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order details */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{order.label}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Game</span>
              <Badge variant="outline" className="font-mono text-xs">{order.game}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs text-muted-foreground">{order._id.slice(-8)}</span>
            </div>
          </div>

          {/* Generated key */}
          {order.status === 'paid' && order.generatedKey && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Your Key</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="font-mono text-sm break-all select-all text-center font-semibold tracking-wider">
                  {order.generatedKey}
                </p>
              </div>
              <div id="receipt-buttons" className="flex gap-2 w-full">
                <Button onClick={handleCopy} className="flex-1 gap-2" variant={copied ? 'outline' : 'default'}>
                  {copied
                    ? <><Check className="h-4 w-4 text-green-500" />Copied!</>
                    : <><Copy className="h-4 w-4" />Copy Key</>
                  }
                </Button>
                <Button onClick={handleDownloadReceipt} className="flex-1 gap-2" variant="outline">
                  <Download className="h-4 w-4" />Receipt
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                ⚠️ Save this key now — it won&apos;t be shown again after you leave.
              </p>
            </div>
          )}

          {/* Pending state */}
          {order.status === 'pending' && (
            <div className="space-y-3 text-center">
              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking payment status...</span>
                </div>
              )}
              {!polling && pollCount >= MAX_POLLS && (
                <p className="text-sm text-muted-foreground">
                  Payment is taking longer than expected. Refresh manually or contact the store.
                </p>
              )}
              <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Status
              </Button>
            </div>
          )}

          {/* Failed / Expired */}
          {(order.status === 'failed' || order.status === 'expired') && (
            <p className="text-sm text-muted-foreground text-center">
              Please try again or contact <strong>{registrator}</strong> for assistance.
            </p>
          )}

          <div id="back-button-container">
            <Link href={`/${registrator}/store`}>
              <Button variant={order.status === 'paid' ? 'outline' : 'default'} className="w-full gap-2">
                <ShoppingCart className="h-4 w-4" />
                {order.status === 'paid' ? 'Back to Store' : 'Try Again'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Hidden GCash-style Receipt Template */}
      <div className="fixed left-[-9999px] top-[-9999px]">
        <div ref={receiptRef} className="w-[380px] bg-white text-black p-8 rounded-2xl shadow-xl font-sans relative overflow-hidden" style={{ minHeight: '550px' }}>
          {/* Header */}
          <div className="text-center space-y-2 mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-[#0051e5] rounded-full flex items-center justify-center mb-4 shadow-md">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-[22px] font-bold text-[#0051e5]">Transaction Receipt</h2>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>

          {/* Amount & Status */}
          <div className="text-center mb-8 relative z-10">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Amount Paid</p>
            <p className="text-[40px] font-extrabold text-gray-900 tracking-tight leading-none">₱{order.price?.toFixed(2) || '0.00'}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-100">
              <CheckCircle2 className="h-4 w-4" /> Successful
            </div>
          </div>

          {/* Details */}
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



          {/* Footer */}
          <div className="mt-10 text-center relative z-10">
            <p className="text-[13px] text-gray-500 font-medium">Thank you for your purchase!</p>
            <p className="text-[11px] text-gray-400 mt-2 font-mono">Ref No. {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0051e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
      </div>

    </div>
  );
}

// ── Page export wraps inner component in Suspense ─────────────────────────
export default function StoreSuccessPage() {
  const { registrator } = useParams<{ registrator: string }>();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent registrator={registrator} />
    </Suspense>
  );
}
