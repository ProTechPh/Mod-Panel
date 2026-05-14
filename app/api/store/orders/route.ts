import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listOrders, getOrderById, deleteOrder } from '@/lib/services/store-service';
import { Logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');

  // Public lookup — for the success page polling
  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    // Only expose non-sensitive fields publicly
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

  // Authenticated — list all orders for the store owner
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registrator = request.nextUrl.searchParams.get('registrator');
  // Level 1 owners see all orders when no registrator is specified; or filter by registrator param
  // Other levels always see only their own orders
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
