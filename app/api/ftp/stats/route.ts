import { NextResponse } from 'next/server';
import { getAllFtpStats } from '@/lib/ftp/client';

const DISK_LIMIT = 5 * 1024 * 1024 * 1024;
const INODE_LIMIT = 80000;
const CACHE_TTL = 5 * 60 * 1000;

let cached: { data: any; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  let disk = { used: 0, total: DISK_LIMIT, used_human: 'N/A', total_human: '5 GB', percent: 0 };
  let inodes = { used: 0, total: INODE_LIMIT, percent: 0 };
  const bandwidth = { used_human: 'N/A', total_human: 'Unlimited' };
  const hits = { used_human: 'N/A', total_human: '50,000' };

  try {
    const stats = await getAllFtpStats();
    disk = {
      used: stats.totalSizeBytes,
      total: DISK_LIMIT,
      used_human: formatBytes(stats.totalSizeBytes),
      total_human: '5 GB',
      percent: DISK_LIMIT > 0 ? +((stats.totalSizeBytes / DISK_LIMIT) * 100).toFixed(1) : 0,
    };
    inodes = {
      used: stats.inodesUsed,
      total: INODE_LIMIT,
      percent: INODE_LIMIT > 0 ? +((stats.inodesUsed / INODE_LIMIT) * 100).toFixed(1) : 0,
    };
  } catch { /* scan failed */ }

  const result = { disk, inodes, bandwidth, hits };
  cached = { data: result, timestamp: now };
  return NextResponse.json(result);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}
