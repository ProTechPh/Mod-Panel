import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listKeys } from '@/lib/services/key-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = request.nextUrl.searchParams.get('type') || 'all';
  const game = request.nextUrl.searchParams.get('game');

  const params = {
    draw: 1,
    start: 0,
    length: 10000,
    search: '',
    order: [{ column: 0, dir: 'asc' as const }],
    registrator: user.level === 1 ? undefined : user.username,
    game: game || undefined,
  };

  const result = await listKeys(params);

  let filteredData = result.data;
  if (type === 'active') {
    filteredData = result.data.filter((k: any) => k.status === 1);
  } else if (type === 'expired') {
    filteredData = result.data.filter((k: any) => k.status === 0 || (k.expiredDate && new Date(k.expiredDate) < new Date()));
  } else if (type === 'unused') {
    filteredData = result.data.filter((k: any) => !k.devices || k.devices.length === 0);
  }

  const csvContent = [
    ['ID', 'Game', 'Key', 'Duration', 'Max Devices', 'Devices Used', 'Status', 'Expired Date', 'Registrator', 'Created At'].join(','),
    ...filteredData.map((k: any) => [
      k._id,
      `"${k.game}"`,
      `"${k.userKey}"`,
      k.duration,
      k.maxDevices,
      k.devices ? k.devices.length : 0,
      k.status === 1 ? 'Active' : 'Inactive',
      k.expiredDate || '',
      `"${k.registrator}"`,
      k.createdAt || '',
    ].join(','))
  ].join('\n');

  const headers = new Headers();
  headers.set('Content-Type', 'text/csv;charset=utf-8');
  headers.set('Content-Disposition', `attachment; filename=keys_${type}_${new Date().toISOString().split('T')[0]}.csv`);

  return new NextResponse(csvContent, { headers });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid input: array of ids required' }, { status: 400 });
    }

    const result = await listKeys({
      draw: 1,
      start: 0,
      length: 10000,
      search: '',
      order: [{ column: 0, dir: 'asc' as const }],
      registrator: user.level === 1 ? undefined : user.username,
    });

    const filteredData = result.data.filter((k: any) => ids.includes(k._id));
    const csvContent = [
      ['ID', 'Game', 'Key', 'Duration', 'Max Devices', 'Devices Used', 'Status', 'Expired Date', 'Registrator', 'Created At'].join(','),
      ...filteredData.map((k: any) => [
        k._id,
        `"${k.game}"`,
        `"${k.userKey}"`,
        k.duration,
        k.maxDevices,
        k.devices ? k.devices.length : 0,
        k.status === 1 ? 'Active' : 'Inactive',
        k.expiredDate || '',
        `"${k.registrator}"`,
        k.createdAt || '',
      ].join(','))
    ].join('\n');

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv;charset=utf-8');
    headers.set('Content-Disposition', 'attachment; filename=selected_keys.csv');

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Export keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
