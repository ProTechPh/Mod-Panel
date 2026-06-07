import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listOrders, getOrderById, deleteOrder } from '@/lib/services/store-service';
import { Logger } from '@/lib/utils';

// In-memory rate limit for unauthenticated orderId lookups
const orderLookupHits = new Map<string, number[]>();
const ORDER_LOOKUP_WINDOW_MS = 60_000;
const ORDER_LOOKUP_MAX = 10;

function checkOrderLookupRateLimit(ip: string): boolean {
  const now = Date.now();
  const hits = orderLookupHits.get(ip) || [];
  const recent = hits.filter(t => now - t < ORDER_LOOKUP_WINDOW_MS);
  if (recent.length >= ORDER_LOOKUP_MAX) return false;
  recent.push(now);
  orderLookupHits.set(ip, recent);
  return true;
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');

  if (orderId) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkOrderLookupRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Only return key for paid orders; never expose key for pending/failed/expired
    return NextResponse.json({
      _id: order._id,
      status: order.status,
      generatedKey: order.status === 'paid' ? order.generatedKey : null,
      game: order.game,
      label: order.label,
      price: order.price,
      registrator: order.registrator,
      createdAt: order.createdAt,
    });
  }

  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registrator = request.nextUrl.searchParams.get('registrator');
  const target = user.level === 1 ? (registrator || null) : user.username;

  const orders = await listOrders(target, 200);
  return NextResponse.json(orders);
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const deleted = await deleteOrder(orderId);
    if (!deleted) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    Logger.info(`Order ${orderId} deleted by ${user.username}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    Logger.error('Delete order error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
