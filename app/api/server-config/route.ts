import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getServerConfig, updateServerConfig } from '@/lib/services/server-config-service';

export const GET = withApi(async () => {
  const config = await getServerConfig();
  return NextResponse.json(config);
});

export const PUT = withApi(async (request) => {
  const body = await request.json();
  const config = await updateServerConfig(body);
  if (!config) return NextResponse.json({ error: 'Config not found' }, { status: 404 });

  return NextResponse.json(config);
}, { level: 1 });
