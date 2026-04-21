import mongoose, { Schema, Document } from 'mongoose';
import type { UserDoc, UserLevel, UserStatus } from '@/types';

const UserSchema = new Schema<UserDoc & Document>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  fullname: { type: String, default: '' },
  password: { type: String, required: true },
  level: { type: Number, required: true, enum: [1, 2, 3] as UserLevel[] },
  saldo: { type: Number, default: 0 },
  status: { type: Number, required: true, enum: [1, 2, 3] as UserStatus[], default: 1 },
  uplink: { type: String, default: '' },
  userIp: { type: String, default: '' },
  telegramContact: { type: String, default: '' },
  telegramId: { type: Number, default: null },
  telegramUsername: { type: String, default: '' },
  expirationDate: { type: Date, required: true },
  loggedIn: { type: Number, default: 0 },
  resetLinkToken: { type: String },
  resetTokenExpiry: { type: Date },
}, { timestamps: true, collection: 'users' });

UserSchema.index({ level: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ uplink: 1 });
UserSchema.index({ expirationDate: 1 });
UserSchema.index({ telegramId: 1 }, { unique: true, partialFilterExpression: { telegramId: { $exists: true, $ne: null } } });

export default mongoose.models.User || mongoose.model<UserDoc & Document>('User', UserSchema);