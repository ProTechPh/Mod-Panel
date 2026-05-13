import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import User from '@/lib/db/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    const admins = await User.find({ 
      level: { $in: [1, 2] },
      status: { $ne: 2 } 
    })
    .select('username level')
    .sort({ username: 1 })
    .lean();
    
    return NextResponse.json({ 
      success: true, 
      data: admins.map(a => ({
        username: a.username,
        level: a.level
      }))
    });
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch admins' 
    }, { status: 500 });
  }
}
