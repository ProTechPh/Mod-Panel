import { NextRequest, NextResponse } from 'next/server';
import { getOrderBySessionId, markOrderPaid } from '@/lib/services/store-service';
import { verifyWebhookSignature, getPayMongoWebhookSecret } from '@/lib/services/paymongo-service';
import { generateKeyString } from '@/lib/utils/device';
import Key from '@/lib/db/models/Key';
import Order from '@/lib/db/models/Order';
import dbConnect from '@/lib/db/connection';
import { Logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sigHeader = request.headers.get('paymongo-signature') || '';

    const webhookSecret = getPayMongoWebhookSecret();
    if (webhookSecret) {
      const valid = verifyWebhookSignature(rawBody, sigHeader, webhookSecret);
      if (!valid) {
        Logger.warn('PayMongo webhook: signature verification failed, rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.data?.attributes?.type || '';
    Logger.info('PayMongo webhook event', { eventType });

    if (eventType !== 'checkout_session.payment.paid') {
      return NextResponse.json({ received: true });
    }

    const sessionData = payload?.data?.attributes?.data;
    const sessionId: string = sessionData?.id || '';

    if (!sessionId) {
      Logger.warn('PayMongo webhook: no sessionId in checkout_session.payment.paid event');
      return NextResponse.json({ received: true });
    }

    const paymentIntentId: string =
      sessionData?.attributes?.payment_intent?.id || '';

    Logger.info('PayMongo webhook: sessionId and payment intent ID', { sessionId, paymentIntentId });

    await dbConnect();

    // Atomic: claim the order by flipping status from pending to processing
    // This prevents duplicate key generation from concurrent webhook deliveries
    const order = await Order.findOneAndUpdate(
      { paymongoCheckoutSessionId: sessionId, status: 'pending' },
      { $set: { status: 'processing' } },
      { returnDocument: 'after' }
    ).lean();

    if (!order) {
      // Check if already paid (idempotent)
      const existing = await Order.findOne({ paymongoCheckoutSessionId: sessionId, status: 'paid' }).lean();
      if (existing) {
        Logger.info('PayMongo webhook: order already paid, skipping', { orderId: existing._id.toString() });
      } else {
        Logger.warn('PayMongo webhook: no pending order found for session', { sessionId });
      }
      return NextResponse.json({ received: true });
    }

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

    await markOrderPaid(order._id, keyString, paymentIntentId);

    Logger.info(`PayMongo webhook: order ${order._id} paid and key generated`);
    return NextResponse.json({ received: true });
  } catch (error) {
    Logger.error('PayMongo webhook error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ received: true });
  }
}
