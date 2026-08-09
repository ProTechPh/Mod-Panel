import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { listKeys } from '@/lib/services/key-service';
import type { KeyDoc } from '@/types';

interface CsvKeyRow {
  _id: string;
  game: string;
  userKey: string;
  duration: KeyDoc['duration'];
  maxDevices: number;
  devices?: string[];
  status: KeyDoc['status'];
  expiredDate: string | null;
  registrator: string;
  createdAt?: string;
}

function toCsv(keys: CsvKeyRow[]): string {
  return [
    ['ID', 'Game', 'Key', 'Duration', 'Max Devices', 'Devices Used', 'Status', 'Expired Date', 'Registrator', 'Created At'].join(','),
    ...keys.map((k) => [
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
}

function csvResponse(csvContent: string, filename: string) {
  const headers = new Headers();
  headers.set('Content-Type', 'text/csv;charset=utf-8');
  headers.set('Content-Disposition', `attachment; filename=${filename}`);
  return new NextResponse(csvContent, { headers });
}

export const GET = withApi(async (request, user) => {
  const type = request.nextUrl.searchParams.get('type') || 'all';
  const game = request.nextUrl.searchParams.get('game');

  const result = await listKeys({
    draw: 1,
    start: 0,
    length: 10000,
    search: '',
    order: [{ column: 0, dir: 'asc' as const }],
    registrator: user.level === 1 ? undefined : user.username,
    game: game || undefined,
  });

  let filteredData = result.data;
  if (type === 'active') {
    filteredData = result.data.filter((k) => k.status === 1);
  } else if (type === 'expired') {
    filteredData = result.data.filter((k) => k.status === 0 || (k.expiredDate && new Date(k.expiredDate) < new Date()));
  } else if (type === 'unused') {
    filteredData = result.data.filter((k) => !k.devices || k.devices.length === 0);
  }

  return csvResponse(
    toCsv(filteredData),
    `keys_${type}_${new Date().toISOString().split('T')[0]}.csv`
  );
});

export const POST = withApi(async (request, user) => {
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

  const filteredData = result.data.filter((k) => ids.includes(k._id));
  return csvResponse(toCsv(filteredData), 'selected_keys.csv');
});
