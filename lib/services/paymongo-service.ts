/**
 * PayMongo API helpers.
 * Keys are read from environment variables:
 *   PAYMONGO_SECRET_KEY
 *   PAYMONGO_PUBLIC_KEY
 *   PAYMONGO_WEBHOOK_SECRET
 *
 * Docs: https://developers.paymongo.com/reference
 */

const PAYMONGO_API = 'https://api.paymongo.com/v1';

function authHeader(secretKey: string) {
  return 'Basic ' + Buffer.from(secretKey + ':').toString('base64');
}

export function getPayMongoSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set in environment variables');
  return key;
}

export function getPayMongoPublicKey(): string {
  const key = process.env.PAYMONGO_PUBLIC_KEY;
  if (!key) throw new Error('PAYMONGO_PUBLIC_KEY is not set in environment variables');
  return key;
}

export function getPayMongoWebhookSecret(): string {
  return process.env.PAYMONGO_WEBHOOK_SECRET || '';
}

export function isPayMongoConfigured(): boolean {
  return !!process.env.PAYMONGO_SECRET_KEY && !!process.env.PAYMONGO_PUBLIC_KEY;
}

export interface CheckoutLineItem {
  name: string;
  quantity: number;
  amount: number; // in centavos (PHP * 100)
  currency: 'PHP';
  description?: string;
}

export interface CreateCheckoutSessionParams {
  lineItems: CheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
  referenceNumber: string; // our orderId
  description: string;
}

export interface CheckoutSessionResponse {
  id: string;
  checkoutUrl: string;
  paymentIntentId: string;
  status: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse | null> {
  try {
    const secretKey = getPayMongoSecretKey();
    const res = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(secretKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: 'Mod Panel Store' },
            line_items: params.lineItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              amount: item.amount,
              currency: item.currency,
              description: item.description || '',
            })),
            payment_method_types: ['gcash', 'paymaya', 'card', 'billease', 'dob', 'grab_pay'],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            reference_number: params.referenceNumber,
            description: params.description,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('PayMongo createCheckoutSession error:', err);
      return null;
    }

    const json = await res.json();
    const attrs = json?.data?.attributes;
    return {
      id: json.data.id,
      checkoutUrl: attrs?.checkout_url || '',
      paymentIntentId: attrs?.payment_intent?.id || '',
      status: attrs?.status || 'pending',
    };
  } catch (err) {
    console.error('PayMongo createCheckoutSession exception:', err);
    return null;
  }
}

export async function retrieveCheckoutSession(
  sessionId: string
): Promise<{ status: string; paymentIntentId: string } | null> {
  try {
    const secretKey = getPayMongoSecretKey();
    const res = await fetch(`${PAYMONGO_API}/checkout_sessions/${sessionId}`, {
      headers: { Authorization: authHeader(secretKey) },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json?.data?.attributes;
    return {
      status: attrs?.status || '',
      paymentIntentId: attrs?.payment_intent?.id || '',
    };
  } catch {
    return null;
  }
}

export function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  webhookSecret: string
): boolean {
  try {
    // PayMongo signature format: t=<timestamp>,te=<hmac>,li=<hmac>
    const parts: Record<string, string> = {};
    sigHeader.split(',').forEach(part => {
      const [k, v] = part.split('=');
      if (k && v) parts[k] = v;
    });

    const timestamp = parts['t'];
    const signature = parts['li'] || parts['te'];
    if (!timestamp || !signature) return false;

    const { createHmac } = require('crypto');
    const expected = createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return expected === signature;
  } catch {
    return false;
  }
}
