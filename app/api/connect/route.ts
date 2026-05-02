import { NextRequest, NextResponse } from 'next/server';
import { validateKey } from '@/lib/services/key-service';
import { connectSchema } from '@/lib/validators/key';
import { getServerConfig } from '@/lib/services/server-config-service';
import GameSetting from '@/lib/db/models/GameSetting';

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
    const formData = await request.formData();
    const body = {
      game: formData.get('game') as string,
      user_key: formData.get('user_key') as string,
      serial: formData.get('serial') as string,
    };

    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        status: false,
        reason: 'Bad Parameter',
      });
    }

    const connectIp = request.headers.get('x-client-ip') || 'unknown';

    const result = await validateKey(body.game, body.user_key, body.serial, connectIp);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({
      status: false,
      reason: 'Server error, try again later.',
    });
  }
}