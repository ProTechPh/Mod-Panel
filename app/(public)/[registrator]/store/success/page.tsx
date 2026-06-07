'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Copy, Check, Loader2, XCircle, Clock, KeyRound, ShoppingCart, RefreshCw, Download,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    if (!polling || pollCount >= MAX_POLLS) {
      if (pollCount >= MAX_POLLS) setPolling(false);
      return;
    }
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-void)' }}>
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--teal-2)' }} />
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--ff-display)', color: 'var(--teal-3)' }}>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-void)' }}>
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 backdrop-blur-sm p-8 text-center space-y-4" style={{ background: 'rgba(9, 19, 24, 0.85)' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle className="h-8 w-8" style={{ color: 'var(--red)' }} />
          </div>
          <h1 className="text-xl font-black" style={{ fontFamily: 'var(--ff-display)', color: 'var(--text-hi)' }}>Order not found</h1>
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>The order ID is invalid or has expired.</p>
          <Link href={`/${registrator}/store`}>
            <Button variant="outline" className="gap-2 font-bold" style={{ borderColor: 'rgba(20, 184, 184, 0.3)', color: 'var(--text-mid)' }}>
              <ShoppingCart className="h-4 w-4" /> Back to Store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusIcon = () => {
    if (order.status === 'paid') return <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--ecto-green)' }} />;
    if (order.status === 'failed') return <XCircle className="h-8 w-8" style={{ color: 'var(--red)' }} />;
    return <Clock className="h-8 w-8" style={{ color: 'var(--gold)' }} />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      <div className="relative z-10 w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <div className="rounded-2xl border border-border/50 backdrop-blur-sm overflow-hidden transition-all duration-300" style={{ background: 'rgba(9, 19, 24, 0.85)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(20, 184, 184, 0.08)' }}>
          {/* Header */}
          <div className="p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border flex items-center justify-center" style={{
                background: order.status === 'paid' ? 'rgba(57, 255, 20, 0.15)' : order.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(240, 192, 64, 0.15)',
                borderColor: order.status === 'paid' ? 'rgba(57, 255, 20, 0.3)' : order.status === 'failed' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(240, 192, 64, 0.3)',
              }}>
                {statusIcon()}
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--ff-display)', color: 'var(--text-hi)' }}>
                {order.status === 'paid' && 'Payment Successful!'}
                {order.status === 'failed' && 'Payment Failed'}
                {order.status === 'pending' && 'Awaiting Payment'}
                {order.status === 'expired' && 'Payment Expired'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
                {order.status === 'paid' && 'Your key has been generated. Keep it safe!'}
                {order.status === 'failed' && 'Your payment could not be processed.'}
                {order.status === 'pending' && 'Waiting for payment confirmation...'}
                {order.status === 'expired' && 'This payment session has expired.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {order.status === 'paid' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'rgba(57, 255, 20, 0.08)', borderColor: 'rgba(57, 255, 20, 0.2)', color: 'var(--ecto-green)' }}>
                  <ShieldCheck className="size-3" /> Verified
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'rgba(20, 184, 184, 0.08)', borderColor: 'rgba(20, 184, 184, 0.2)', color: 'var(--teal-3)' }}>
                <KeyRound className="size-3" /> Order #{order._id.slice(-8)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            <div className="rounded-xl border border-border/40 p-4 space-y-3" style={{ background: 'rgba(2, 6, 8, 0.4)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-mid)' }}>Product</span>
                <span className="font-bold" style={{ color: 'var(--text-hi)' }}>{order.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-mid)' }}>Game</span>
                <Badge variant="outline" className="font-mono text-xs font-bold">{order.game}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-mid)' }}>Order ID</span>
                <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-mid)' }}>{order._id.slice(-8)}</span>
              </div>
            </div>

            {order.status === 'paid' && order.generatedKey && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" style={{ color: 'var(--teal-2)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>Your Key</p>
                </div>
                <div className="rounded-xl border p-4 relative overflow-hidden group" style={{ borderColor: 'rgba(20, 184, 184, 0.3)', background: 'rgba(20, 184, 184, 0.05)' }}>
                  <p className="font-mono text-sm break-all select-all text-center font-bold tracking-wider relative z-10" style={{ color: 'var(--text-hi)' }}>
                    {order.generatedKey}
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button onClick={handleCopy} className="flex-1 gap-2 font-bold" variant={copied ? 'outline' : 'default'}>
                    {copied
                      ? <><Check className="h-4 w-4" style={{ color: 'var(--ecto-green)' }} />Copied!</>
                      : <><Copy className="h-4 w-4" />Copy Key</>
                    }
                  </Button>
                  <Button onClick={handleDownloadReceipt} className="flex-1 gap-2 font-bold" variant="outline">
                    <Download className="h-4 w-4" />Receipt
                  </Button>
                </div>
                <div className="flex items-center gap-2 justify-center text-xs" style={{ color: 'var(--text-mid)' }}>
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
                  <span className="font-medium">Save this key now — it won&apos;t be shown again after you leave.</span>
                </div>
              </div>
            )}

            {order.status === 'pending' && (
              <div className="space-y-3 text-center">
                {polling && (
                  <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Checking payment status...</span>
                  </div>
                )}
                {!polling && pollCount >= MAX_POLLS && (
                  <p className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>
                    Payment is taking longer than expected. Refresh manually or contact the store.
                  </p>
                )}
                <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2 font-bold">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh Status
                </Button>
              </div>
            )}

            {(order.status === 'failed' || order.status === 'expired') && (
              <p className="text-sm text-center font-medium" style={{ color: 'var(--text-mid)' }}>
                Please try again or contact <strong style={{ color: 'var(--text-hi)' }}>{registrator}</strong> for assistance.
              </p>
            )}

            <Link href={`/${registrator}/store`}>
              <Button variant={order.status === 'paid' ? 'outline' : 'default'} className="w-full gap-2 font-bold">
                <ShoppingCart className="h-4 w-4" />
                {order.status === 'paid' ? 'Back to Store' : 'Try Again'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden Receipt Template */}
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
            <p className="text-[11px] text-gray-400 mt-2 font-mono">Ref No. {order._id.slice(-12).toUpperCase()}</p>
          </div>

          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0051e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
      </div>
    </div>
  );
}

export default function StoreSuccessPage() {
  const { registrator } = useParams<{ registrator: string }>();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-void)' }}>
        <Loader2 className="h-8 w-8 animate-spin relative z-10" style={{ color: 'var(--teal-2)' }} />
      </div>
    }>
      <SuccessContent registrator={registrator} />
    </Suspense>
  );
}
