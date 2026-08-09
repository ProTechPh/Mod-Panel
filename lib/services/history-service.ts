import dbConnect from '@/lib/db/connection';
import History from '@/lib/db/models/History';
import { toIsoString } from '@/lib/utils/dates';

export async function logAction(keyId: string, userDo: string, info: string) {
  await dbConnect();
  await History.create({ keyId, userDo, info });
}

export async function getHistory(userDo?: string, limit: number = 100) {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (userDo) filter.userDo = userDo;

  const history = await History.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return history.map(h => ({
    ...h,
    _id: h._id.toString(),
    createdAt: toIsoString(h.createdAt),
  }));
}

export async function clearHistory(userDo?: string) {
  await dbConnect();
  if (userDo) {
    await History.deleteMany({ userDo });
  } else {
    await History.deleteMany({});
  }
  return true;
}