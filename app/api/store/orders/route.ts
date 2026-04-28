import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listOrders, getOrderById } from '@/lib/services/store-service';

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
  // Level 1 owners can see any registrator's orders; others see only their own
  const target = (user.level === 1 && registrator) ? registrator : user.username;

  const orders = await listOrders(target, 100);
  return NextResponse.json(orders);
}
