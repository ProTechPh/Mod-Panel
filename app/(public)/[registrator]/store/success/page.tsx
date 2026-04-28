'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Copy, Check, Loader2, XCircle, Clock, KeyRound, ShoppingCart, RefreshCw,
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
              <Button onClick={handleCopy} className="w-full gap-2" variant={copied ? 'outline' : 'default'}>
                {copied
                  ? <><Check className="h-4 w-4 text-green-500" />Copied!</>
                  : <><Copy className="h-4 w-4" />Copy Key</>
                }
              </Button>
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

          <Link href={`/${registrator}/store`}>
            <Button variant={order.status === 'paid' ? 'outline' : 'default'} className="w-full gap-2">
              <ShoppingCart className="h-4 w-4" />
              {order.status === 'paid' ? 'Back to Store' : 'Try Again'}
            </Button>
          </Link>
        </CardContent>
      </Card>
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
