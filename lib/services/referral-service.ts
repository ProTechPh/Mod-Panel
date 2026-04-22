import dbConnect from '@/lib/db/connection';
import Referral from '@/lib/db/models/Referral';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charLen = chars.length;
  const maxByte = Math.floor(256 / charLen) * charLen;
  const randomValues = new Uint8Array(12);
  crypto.getRandomValues(randomValues);
  let result = '';
  let byteIndex = 0;
  for (let i = 0; i < 6; i++) {
    let byte: number;
    do {
      byte = randomValues[byteIndex++]!;
    } while (byte >= maxByte);
    result += chars.charAt(byte % charLen);
  }
  return result;
}

export async function createReferral(createdBy: string, level: number, setSaldo: number, accExpirationDays: number) {
  await dbConnect();
  const plainCode = generateReferralCode();
  const codeHash = require('crypto').createHash('md5').update(plainCode).digest('hex');

  const now = new Date();
  const accExpiration = new Date(now.getTime() + accExpirationDays * 24 * 60 * 60 * 1000);

  const referral = await Referral.create({
    code: codeHash,
    referralPlain: plainCode,
    level,
    setSaldo,
    usedBy: '',
    createdBy,
    accExpiration,
  });

  return {
    _id: referral._id.toString(),
    code: plainCode,
    level: referral.level,
    setSaldo: referral.setSaldo,
    createdBy: referral.createdBy,
    accExpiration: referral.accExpiration.toISOString(),
  };
}

export async function listReferrals(createdBy?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (createdBy) filter.createdBy = createdBy;

  const referrals = await Referral.find(filter).sort({ createdAt: -1 }).lean();
  return referrals.map(r => ({
    ...r,
    _id: r._id.toString(),
    code: r.referralPlain,
    accExpiration: r.accExpiration?.toISOString(),
    createdAt: r.createdAt?.toISOString(),
  }));
}

export async function updateReferral(id: string, data: {
  level?: number;
  setSaldo?: number;
  accExpirationDays?: number;
}) {
  await dbConnect();

  const update: Record<string, unknown> = {};
  if (data.level !== undefined) update.level = data.level;
  if (data.setSaldo !== undefined) update.setSaldo = data.setSaldo;

  if (data.accExpirationDays !== undefined) {
    const referral = await Referral.findById(id).lean();
    const now = new Date();
    const currentAccExpiration = referral?.accExpiration ? new Date(referral.accExpiration) : now;
    update.accExpiration = new Date(currentAccExpiration.getTime() + data.accExpirationDays * 24 * 60 * 60 * 1000);
  }

  const updated = await Referral.findByIdAndUpdate(id, update, { new: true }).lean();
  return updated ? { ...updated, _id: updated._id.toString() } : null;
}

export async function deleteReferral(id: string) {
  await dbConnect();
  const result = await Referral.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function deleteReferralsByUser(createdBy: string) {
  await dbConnect();
  const result = await Referral.deleteMany({ createdBy });
  return result.deletedCount;
}
