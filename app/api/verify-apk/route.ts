import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import GameSetting from '@/lib/db/models/GameSetting';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    let game = '';
    let userKey = '';
    let apkSha1 = '';
    let apkSha256 = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await request.json();
      game = (json.game || '').trim().toUpperCase();
      userKey = (json.user_key || '').trim();
      apkSha1 = (json.apk_sha1 || '').trim().toLowerCase();
      apkSha256 = (json.apk_sha256 || '').trim().toLowerCase();
    } else {
      const formData = await request.formData();
      game = (formData.get('game') as string || '').trim().toUpperCase();
      userKey = (formData.get('user_key') as string || '').trim();
      apkSha1 = (formData.get('apk_sha1') as string || '').trim().toLowerCase();
      apkSha256 = (formData.get('apk_sha256') as string || '').trim().toLowerCase();
    }

    if (!game || !userKey) {
      return NextResponse.json({ status: false, reason: 'Missing game or user_key' });
    }

    if (!apkSha1 && !apkSha256) {
      return NextResponse.json({ status: false, reason: 'Missing signatures' });
    }

    await dbConnect();

    // Look up the key to find its registrator
    const key = await Key.findOne({ userKey, game }).lean();
    if (!key) {
      return NextResponse.json({ status: false, reason: 'Key not found' });
    }

    // Look up the game setting for this specific registrator
    const gameSetting = await GameSetting.findOne({
      gameCode: game,
      registrator: key.registrator,
    }).lean();

    if (!gameSetting || !gameSetting.apkSignatureEnabled) {
      return NextResponse.json({ status: true, reason: 'Signature check disabled for this user' });
    }

    const expectedSha1 = (gameSetting.apkSha1 || '').toLowerCase();
    const expectedSha256 = (gameSetting.apkSha256 || '').toLowerCase();

    const sha1Match = !expectedSha1 || apkSha1 === expectedSha1;
    const sha256Match = !expectedSha256 || apkSha256 === expectedSha256;

    if (sha1Match && sha256Match) {
      return NextResponse.json({ status: true, reason: 'Signature valid' });
    }

    Logger.warn('APK signature mismatch', {
      registrator: key.registrator,
      game,
      received: { sha1: apkSha1, sha256: apkSha256 },
      expected: { sha1: expectedSha1, sha256: expectedSha256 },
    });

    return NextResponse.json({ status: false, reason: 'APK signature mismatch' });
  } catch (error) {
    console.error('Verify APK error:', error);
    return NextResponse.json({ status: false, reason: 'Server error' });
  }
}
