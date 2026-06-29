import dbConnect from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { verifyPassword, hashPassword, needsRehash } from '@/lib/auth/password';
import type { UserLevel, UserStatus } from '@/types';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function loginUser(identifier: string, password: string) {
  await dbConnect();
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  }).lean();
  if (!user) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  if (needsRehash(user.password)) {
    // Use findAndModify to prevent race condition
    const result = await User.findOneAndUpdate(
      { _id: user._id, password: { $ne: user.password } },
      { $set: { password: await hashPassword(password) } },
      { returnDocument: 'after' }
    ).lean();
    // Only update if password hasn't changed since we read it
    if (!result) {
      await User.updateOne({ _id: user._id }, { password: await hashPassword(password) });
    }
  }

  await User.updateOne({ _id: user._id }, { $inc: { loggedIn: 1 } });

  return {
    userId: user._id.toString(),
    username: user.username,
    level: user.level as UserLevel,
    status: user.status as UserStatus,
    fullname: user.fullname,
    saldo: user.saldo,
    expirationDate: user.expirationDate,
  };
}

export async function registerUser(data: {
  username: string;
  email: string;
  fullname: string;
  password: string;
  referralCode: string;
}) {
  await dbConnect();

  const existingUser = await User.findOne({
    $or: [{ username: data.username }, { email: data.email }],
  });
  if (existingUser) return null;

  const { createHash } = await import('crypto');
  const codeHash = createHash('md5').update(data.referralCode).digest('hex');

  const Referral = (await import('@/lib/db/models/Referral')).default;
  const referral = await Referral.findOne({ code: codeHash });

  if (!referral || referral.usedBy) return null;

  const hashedPassword = await hashPassword(data.password);
  const now = new Date();

  const durationMs = referral.accExpiration.getTime() - referral.createdAt.getTime();
  const expirationDate = new Date(now.getTime() + durationMs);
  const level = referral.level;
  const saldo = referral.setSaldo;
  const uplink = referral.createdBy;

  await Referral.updateOne({ _id: referral._id }, { usedBy: data.username });

  const user = await User.create({
    username: data.username,
    email: data.email,
    fullname: data.fullname,
    password: hashedPassword,
    level,
    saldo,
    status: 1,
    uplink,
    expirationDate,
    loggedIn: 0,
  });

  return {
    userId: user._id.toString(),
    username: user.username,
    level: user.level as UserLevel,
  };
}

export async function listUsers(params: {
  draw: number;
  start: number;
  length: number;
  search?: string;
  order?: { column: number; dir: 'asc' | 'desc' }[];
}) {
  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (params.search) {
    const safeSearch = escapeRegex(params.search);
    filter.$or = [
      { username: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { fullname: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const recordsTotal = await User.countDocuments({});
  const recordsFiltered = await User.countDocuments(filter);

  const sortColumn = ['createdAt', 'username', 'email', 'level', 'saldo', 'status', 'expirationDate'][params.order?.[0]?.column ?? 0] || 'createdAt';
  const sortDir = params.order?.[0]?.dir === 'asc' ? 1 : -1;

  const data = await User.find(filter)
    .select('-password -resetLinkToken -resetTokenExpiry')
    .sort({ [sortColumn]: sortDir })
    .skip(params.start)
    .limit(params.length)
    .lean();

  return {
    draw: params.draw,
    recordsTotal,
    recordsFiltered,
    data: data.map(u => ({
      ...u,
      _id: u._id.toString(),
      expirationDate: u.expirationDate instanceof Date ? u.expirationDate.toISOString() : u.expirationDate,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
    })),
  };
}

export async function getUser(id: string) {
  await dbConnect();
  const user = await User.findById(id).select('-password').lean();
  if (!user) return null;
  return { ...user, _id: user._id.toString() };
}

export async function updateUser(id: string, data: {
  fullname?: string;
  email?: string;
  level?: UserLevel;
  saldo?: number;
  status?: UserStatus;
  expirationDate?: string;
}) {
  await dbConnect();
  const update: Record<string, unknown> = {};
  if (data.fullname !== undefined) update.fullname = data.fullname;
  if (data.email !== undefined) update.email = data.email;
  if (data.level !== undefined) update.level = data.level;
  if (data.saldo !== undefined) update.saldo = data.saldo;
  if (data.status !== undefined) update.status = data.status;
  if (data.expirationDate !== undefined) update.expirationDate = new Date(data.expirationDate);
  const user = await User.findByIdAndUpdate(id, update, { returnDocument: 'after' }).select('-password').lean();
  return user ? { ...user, _id: user._id.toString() } : null;
}

export async function deleteUser(id: string) {
  await dbConnect();
  const result = await User.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return false;

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) return false;

  user.password = await hashPassword(newPassword);
  await user.save();
  return true;
}

export async function checkExpiration() {
  await dbConnect();
  const now = new Date();
  const result = await User.updateMany(
    { status: 1, expirationDate: { $lt: now } },
    { $set: { status: 3 } }
  );
  return result.modifiedCount;
}

export async function generateResetToken(identifier: string) {
  await dbConnect();
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
  if (!user) return null;

  const { randomBytes } = await import('crypto');
  const token = randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await User.updateOne(
    { _id: user._id },
    { $set: { resetLinkToken: token, resetTokenExpiry: expiry } }
  );

  return { username: user.username, email: user.email, token };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  await dbConnect();
  const user = await User.findOne({
    resetLinkToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });
  if (!user) return null;

  const hashed = await hashPassword(newPassword);
  await User.updateOne(
    { _id: user._id },
    { $set: { password: hashed }, $unset: { resetLinkToken: 1, resetTokenExpiry: 1 } }
  );

  return { username: user.username };
}

// Export escapeRegex for other modules to use
export { escapeRegex };