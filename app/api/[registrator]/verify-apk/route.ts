import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import GameSetting from '@/lib/db/models/GameSetting';
import { Logger } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ registrator: string }> }
) {
  try {
    const { registrator } = await params;
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

    if (!registrator || !game) {
      return NextResponse.json({ status: false, reason: 'Missing registrator or game' });
    }

    if (!apkSha1 && !apkSha256) {
      return NextResponse.json({ status: false, reason: 'Missing signatures' });
    }

    await dbConnect();

    // Look up this specific registrator's game setting
    const gameSetting = await GameSetting.findOne({
      gameCode: game,
      registrator,
    }).lean();

    if (!gameSetting || !gameSetting.apkSignatureEnabled) {
      return NextResponse.json({ status: true, reason: 'Signature check disabled' });
    }

    const expectedSha1 = (gameSetting.apkSha1 || '').toLowerCase();
    const expectedSha256 = (gameSetting.apkSha256 || '').toLowerCase();

    // If check is enabled but no hashes configured, reject (admin must configure first)
    if (!expectedSha1 && !expectedSha256) {
      return NextResponse.json({ status: false, reason: 'Signature check enabled but no hashes configured' });
    }

    const sha1Match = apkSha1 === expectedSha1;
    const sha256Match = apkSha256 === expectedSha256;

    // Require at least one non-empty expected hash to match
    if ((expectedSha1 && sha1Match) || (expectedSha256 && sha256Match)) {
      return NextResponse.json({ status: true, reason: 'Signature valid' });
    }

    Logger.warn('APK signature mismatch', {
      registrator,
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
