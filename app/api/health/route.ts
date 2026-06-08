import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  let mongoStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    await dbConnect();
    const readyState = mongoose.connection.readyState;
    mongoStatus = readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    mongoStatus = 'disconnected';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus,
    version: process.env.npm_package_version || '1.0.0',
  });
}
