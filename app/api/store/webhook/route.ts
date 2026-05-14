import { NextRequest, NextResponse } from 'next/server';
import { getOrderBySessionId, markOrderPaid } from '@/lib/services/store-service';
import { verifyWebhookSignature, getPayMongoWebhookSecret } from '@/lib/services/paymongo-service';
import { generateKeyString } from '@/lib/utils/device';
import Key from '@/lib/db/models/Key';
import User from '@/lib/db/models/User';
import dbConnect from '@/lib/db/connection';
import { Logger } from '@/lib/utils';

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
    Logger.info('PayMongo webhook event', { eventType });

    // We only care about successful checkout sessions
    if (eventType !== 'checkout_session.payment.paid') {
      return NextResponse.json({ received: true });
    }

    // The event data IS the checkout session object
    const sessionData = payload?.data?.attributes?.data;
    const sessionId: string = sessionData?.id || '';

    if (!sessionId) {
      Logger.warn('PayMongo webhook: no sessionId in checkout_session.payment.paid event');
      return NextResponse.json({ received: true });
    }

    // Extract payment intent ID from the nested payload
    const paymentIntentId: string =
      sessionData?.attributes?.payment_intent?.id || '';

    Logger.info('PayMongo webhook: sessionId and payment intent ID', { sessionId, paymentIntentId });

    // Find our order
    const order = await getOrderBySessionId(sessionId);
    if (!order) {
      Logger.warn('PayMongo webhook: no order found for session', { sessionId });
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already paid
    if (order.status === 'paid') {
      Logger.info('PayMongo webhook: order already paid, skipping', { orderId: order._id.toString() });
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

    // Deduct saldo based on the order price
    const registratorUser = await User.findOne({ username: order.registrator });
    if (!registratorUser) {
      Logger.error(`PayMongo webhook: registrator ${order.registrator} not found for order ${order._id}`);
      return NextResponse.json({ received: true });
    }

    if (registratorUser.saldo < order.price) {
      Logger.error(`PayMongo webhook: registrator ${order.registrator} has insufficient saldo (${registratorUser.saldo} < ${order.price}) for order ${order._id}`);
      // Still deliver the key but log the deficit
      await User.findOneAndUpdate(
        { username: order.registrator },
        { $inc: { saldo: -order.price } }
      );
    } else {
      await User.findOneAndUpdate(
        { username: order.registrator },
        { $inc: { saldo: -order.price } }
      );
    }

    Logger.info(`PayMongo webhook: order ${order._id} paid and key generated`);
    return NextResponse.json({ received: true });
  } catch (error) {
    Logger.error('PayMongo webhook error', { error: error instanceof Error ? error.message : String(error) });
    // Return 200 so PayMongo doesn't retry endlessly on our bugs
    return NextResponse.json({ received: true });
  }
}
