import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import History from '@/lib/db/models/History';
import Key from '@/lib/db/models/Key';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { key, serial, device_info, reason, details } = await req.json();

    if (!key || !serial) {
      return NextResponse.json({ status: false }, { status: 400 });
    }

    // Find key ID for reference
    const keyRecord = await Key.findOne({ userKey: key }).lean();
    
    // Log the violation in History
    await History.create({
      keyId: keyRecord?._id || 'UNKNOWN',
      userDo: 'SECURITY_VIOLATION',
      info: `🚨 CRACK ATTEMPT DETECTED!\nDevice: ${device_info || 'UNKNOWN'}\nReason: ${reason}\nKey: ${key}\nSerial: ${serial}\nDetails: ${details || 'N/A'}`,
      createdAt: new Date()
    });

    return NextResponse.json({ status: true, message: 'Violation reported' });
  } catch (error) {
    console.error('Report Error:', error);
    return NextResponse.json({ status: false }, { status: 500 });
  }
}
