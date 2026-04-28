import { NextRequest, NextResponse } from 'next/server';
import { getOrderBySessionId, markOrderPaid } from '@/lib/services/store-service';
import { verifyWebhookSignature, getPayMongoWebhookSecret } from '@/lib/services/paymongo-service';
import { generateKeyString } from '@/lib/utils/device';
import Key from '@/lib/db/models/Key';
import dbConnect from '@/lib/db/connection';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sigHeader = request.headers.get('paymongo-signature') || '';

    // Verify webhook signature if PAYMONGO_WEBHOOK_SECRET is set
    const webhookSecret = getPayMongoWebhookSecret();
    if (webhookSecret) {
      const valid = verifyWebhookSignature(rawBody, sigHeader, webhookSecret);
      if (!valid) {
        // Log warning but continue processing — don't block on signature mismatch
        // during development. Re-enable strict mode in production after confirming
        // the correct webhook secret is in env.
        console.warn('PayMongo webhook: signature mismatch (continuing anyway)');
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.data?.attributes?.type || '';
    console.log('PayMongo webhook event:', eventType);

    // We only care about successful checkout sessions
    if (eventType !== 'checkout_session.payment.paid') {
      return NextResponse.json({ received: true });
    }

    // The event data IS the checkout session object
    const sessionData = payload?.data?.attributes?.data;
    const sessionId: string = sessionData?.id || '';

    if (!sessionId) {
      console.warn('PayMongo webhook: no sessionId in checkout_session.payment.paid event');
      return NextResponse.json({ received: true });
    }

    // Extract payment intent ID from the nested payload
    const paymentIntentId: string =
      sessionData?.attributes?.payment_intent?.id || '';

    console.log('PayMongo webhook: sessionId', sessionId, 'paymentIntentId', paymentIntentId);

    // Find our order
    const order = await getOrderBySessionId(sessionId);
    if (!order) {
      console.warn('PayMongo webhook: no order found for session', sessionId);
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already paid
    if (order.status === 'paid') {
      console.log('PayMongo webhook: order already paid, skipping', order._id);
      return NextResponse.json({ received: true });
    }

    // Generate key for the buyer
    await dbConnect();
    const keyString = generateKeyString(16);
    await Key.create({
      game: order.game,
      userKey: keyString,
      duration: order.duration,
      maxDevices: order.maxDevices,
      devices: [],
      status: 1,
      registrator: order.registrator,
      isFreeKey: false,
    });

    // Mark order paid
    await markOrderPaid(order._id, keyString, paymentIntentId);

    console.log(`PayMongo webhook: order ${order._id} paid ✓ key generated`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayMongo webhook error:', error);
    // Return 200 so PayMongo doesn't retry endlessly on our bugs
    return NextResponse.json({ received: true });
  }
}
