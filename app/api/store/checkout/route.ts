import { NextRequest, NextResponse } from 'next/server';
import { getProduct, getStore, createOrder } from '@/lib/services/store-service';
import { createCheckoutSession, isPayMongoConfigured } from '@/lib/services/paymongo-service';
import Order from '@/lib/db/models/Order';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, registrator, buyerName } = body;

    if (!productId || !registrator) {
      return NextResponse.json({ error: 'productId and registrator are required' }, { status: 400 });
    }

    // 1. Validate PayMongo is configured via env
    if (!isPayMongoConfigured()) {
      return NextResponse.json({ error: 'Payment is not configured. Contact the store owner.' }, { status: 503 });
    }

    // 2. Validate store is active
    const store = await getStore(registrator);
    if (!store || !store.isActive) {
      return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 });
    }

    // 3. Validate product
    const product = await getProduct(productId);
    if (!product || !product.isActive || product.registrator !== registrator) {
      return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 });
    }

    // 4. Create order (pending)
    const order = await createOrder({
      registrator,
      productId,
      game: product.game,
      label: product.label,
      duration: product.duration,
      maxDevices: product.maxDevices,
      price: product.price,
      buyerName: buyerName?.trim() || '',
    });

    // 5. Build URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/${registrator}/store/success?orderId=${order._id}`;
    const cancelUrl = `${appUrl}/${registrator}/store`;

    // 6. Create PayMongo checkout session (keys read from env internally)
    const session = await createCheckoutSession({
      lineItems: [
        {
          name: product.label,
          quantity: 1,
          amount: Math.round(product.price * 100), // PHP → centavos
          currency: 'PHP',
          description: `${product.game} key • ${product.duration} • ${product.maxDevices} device(s)`,
        },
      ],
      successUrl,
      cancelUrl,
      referenceNumber: order._id,
      description: `${store.storeName} — ${product.label}`,
    });

    if (!session) {
      // Mark order as failed since we couldn't create a payment session
      await Order.findByIdAndUpdate(order._id, { status: 'failed' });
      return NextResponse.json({ error: 'Failed to create payment session. Check PayMongo configuration.' }, { status: 502 });
    }

    // 7. Update order with session ID
    const updated = await Order.findByIdAndUpdate(order._id, {
      paymongoCheckoutSessionId: session.id,
      paymongoPaymentIntentId: session.paymentIntentId,
    });

    if (!updated) {
      Logger.error('Checkout: failed to update order with session ID', { orderId: order._id, sessionId: session.id });
      return NextResponse.json({ error: 'Failed to finalize order. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      checkoutUrl: session.checkoutUrl,
      orderId: order._id,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
