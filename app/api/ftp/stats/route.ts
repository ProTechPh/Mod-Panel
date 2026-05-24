import { NextResponse } from 'next/server';
import { getAllFtpStats, getFtpConfigs } from '@/lib/ftp/client';

const PER_FTP_DISK = 5 * 1024 * 1024 * 1024;
const PER_FTP_INODES = 80000;
const CACHE_TTL = 5 * 60 * 1000;

let cached: { data: any; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const configs = await getFtpConfigs();
  const totalDisk = configs.reduce((s, c) => s + (c.diskLimit || PER_FTP_DISK), 0);
  const totalInodes = configs.reduce((s, c) => s + (c.inodeLimit || PER_FTP_INODES), 0);

  let disk = { used: 0, total: totalDisk, used_human: 'N/A', total_human: formatBytes(totalDisk), percent: 0 };
  let inodes = { used: 0, total: totalInodes, percent: 0 };
  const bandwidth = { used_human: 'N/A', total_human: 'Unlimited' };
  const hits = { used_human: 'N/A', total_human: '50,000' };

  try {
    const stats = await getAllFtpStats();
    disk = {
      used: stats.totalSizeBytes,
      total: totalDisk,
      used_human: formatBytes(stats.totalSizeBytes),
      total_human: formatBytes(totalDisk),
      percent: totalDisk > 0 ? +((stats.totalSizeBytes / totalDisk) * 100).toFixed(1) : 0,
    };
    inodes = {
      used: stats.inodesUsed,
      total: totalInodes,
      percent: totalInodes > 0 ? +((stats.inodesUsed / totalInodes) * 100).toFixed(1) : 0,
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
