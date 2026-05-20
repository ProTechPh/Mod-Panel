import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import GameSetting from '@/lib/db/models/GameSetting';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    let game = '';
    let apkSha1 = '';
    let apkSha256 = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await request.json();
      game = (json.game || '').trim().toUpperCase();
      apkSha1 = (json.apk_sha1 || '').trim().toLowerCase();
      apkSha256 = (json.apk_sha256 || '').trim().toLowerCase();
    } else {
      const formData = await request.formData();
      game = (formData.get('game') as string || '').trim().toUpperCase();
      apkSha1 = (formData.get('apk_sha1') as string || '').trim().toLowerCase();
      apkSha256 = (formData.get('apk_sha256') as string || '').trim().toLowerCase();
    }

    if (!game) {
      return NextResponse.json({ status: false, reason: 'Missing game' });
    }

    if (!apkSha1 && !apkSha256) {
      return NextResponse.json({ status: false, reason: 'Missing signatures' });
    }

    await dbConnect();

    // Find all game settings for this game with signature check enabled
    const enabledSettings = await GameSetting.find({
      gameCode: game,
      apkSignatureEnabled: true,
    }).lean();

    // No registrator has signature check enabled → allow
    if (enabledSettings.length === 0) {
      return NextResponse.json({ status: true, reason: 'Signature check disabled' });
    }

    // Check received signatures against each registrator's expected values
    for (const setting of enabledSettings) {
      const expectedSha1 = (setting.apkSha1 || '').toLowerCase();
      const expectedSha256 = (setting.apkSha256 || '').toLowerCase();

      const sha1Match = !expectedSha1 || apkSha1 === expectedSha1;
      const sha256Match = !expectedSha256 || apkSha256 === expectedSha256;

      if (sha1Match && sha256Match) {
        return NextResponse.json({ status: true, reason: 'Signature valid' });
      }
    }

    // Log mismatch details for debugging
    Logger.warn('APK signature mismatch for all registrators', {
      game,
      received: { sha1: apkSha1, sha256: apkSha256 },
      enabledRegistrators: enabledSettings.map(s => ({
        registrator: s.registrator,
        expected: { sha1: s.apkSha1, sha256: s.apkSha256 },
      })),
    });

    return NextResponse.json({ status: false, reason: 'APK signature mismatch' });
  } catch (error) {
    console.error('Verify APK error:', error);
    return NextResponse.json({ status: false, reason: 'Server error' });
  }
}
