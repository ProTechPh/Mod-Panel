import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateKey } from '@/lib/services/key-service';
import { connectSchema } from '@/lib/validators/key';
import { getServerConfig } from '@/lib/services/server-config-service';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Mod Panel';
const LICENSE_KEY = process.env.LICENSE_KEY || '5G7B3F8J2H';

export async function GET() {
  const config = await getServerConfig();
  const channel = config?.telegramChannel || 'https://t.me/@CanKillYouForever';
  const group = config?.telegramGroup || 'https://t.me/@CanKillYouForever';

  return NextResponse.json({
    web_info: {
      _client: APP_NAME,
      license: LICENSE_KEY,
      version: '3.0.5',
      announcement: config?.announcementStatus === 'on' ? config.announcement : null,
    },
    web__dev: {
      author: 'ProTech Dev',
      Channel: channel,
      Group: group,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await request.json();
      body = {
        game: (json.game || '').trim(),
        user_key: (json.user_key || '').trim(),
        serial: (json.serial || '').trim(),
        ts: (json.ts || '').trim(),
        sign: (json.sign || '').trim(),
      };
    } else {
      const formData = await request.formData();
      body = {
        game: (formData.get('game') as string || '').trim(),
        user_key: (formData.get('user_key') as string || '').trim(),
        serial: (formData.get('serial') as string || '').trim(),
        ts: (formData.get('ts') as string || '').trim(),
        sign: (formData.get('sign') as string || '').trim(),
      };
    }

    if (!body.ts || !body.sign) {
      return NextResponse.json({ status: false, reason: "Security Exception: 0xX_UNAUTHORIZED_REQ" });
    }

    const timestamp = Number(body.ts);
    if (isNaN(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ status: false, reason: "Security Exception: 0xX_UNAUTHORIZED_REQ" });
    }

    const expectedSign = crypto.createHash('md5').update(`${body.game}-${body.user_key}-${body.serial}-${body.ts}-P7@t#R9q!w^X$mZ2&v*N(c)L_k`).digest('hex');
    if (body.sign !== expectedSign) {
      return NextResponse.json({ status: false, reason: "Security Exception: 0xX_UNAUTHORIZED_REQ" });
    }

    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => `${i.path}: ${i.message}`).join(', ');
      return NextResponse.json({
        status: false,
        reason: `Invalid Parameters: ${errorMsg}`,
      });
    }

    const result = await validateKey(body.game, body.user_key, body.serial);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({
      status: false,
      reason: 'Server error, try again later.',
    });
  }
}