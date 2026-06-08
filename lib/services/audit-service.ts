import dbConnect from '@/lib/db/connection';
import AuditLog from '@/lib/db/models/AuditLog';

export async function logAudit(entry: {
  action: string;
  actor: string;
  actorLevel: number;
  target?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  await dbConnect();
  return AuditLog.create({
    action: entry.action,
    actor: entry.actor,
    actorLevel: entry.actorLevel,
    target: entry.target || '',
    details: entry.details || {},
    ip: entry.ip || '',
  });
}

export async function listAuditLogs(params: {
  start: number;
  length: number;
  search?: string;
  action?: string;
  actor?: string;
  startDate?: string;
  endDate?: string;
}) {
  await dbConnect();

  const filter: Record<string, unknown> = {};

  if (params.search) {
    const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { actor: { $regex: escaped, $options: 'i' } },
      { target: { $regex: escaped, $options: 'i' } },
      { action: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (params.action) filter.action = params.action;
  if (params.actor) filter.actor = params.actor;

  if (params.startDate || params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter.$gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    filter.createdAt = dateFilter;
  }

  const recordsTotal = await AuditLog.countDocuments({});
  const recordsFiltered = await AuditLog.countDocuments(filter);

  const data = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(params.start)
    .limit(params.length)
    .lean();

  return {
    recordsTotal,
    recordsFiltered,
    data: data.map(log => ({
      ...log,
      _id: log._id.toString(),
      createdAt: log.createdAt?.toISOString(),
    })),
  };
}

export async function getAuditStats() {
  await dbConnect();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await AuditLog.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return {
    total,
    byAction: stats.map(s => ({ action: s._id, count: s.count })),
  };
}
