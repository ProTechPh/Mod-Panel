import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getServerConfig, updateServerConfig } from '@/lib/services/server-config-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const config = await getServerConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const config = await updateServerConfig(body);
    if (!config) return NextResponse.json({ error: 'Config not found' }, { status: 404 });

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Server config update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}