import mongoose, { Schema, Document } from 'mongoose';
import type { ReferralDoc, UserLevel } from '@/types';

const ReferralSchema = new Schema<ReferralDoc & Document>({
  code: { type: String, required: true, unique: true },
  referralPlain: { type: String, required: true },
  level: { type: Number, required: true, enum: [1, 2, 3] as UserLevel[] },
  setSaldo: { type: Number, default: 0 },
  usedBy: { type: String, default: '' },
  createdBy: { type: String, required: true },
  accExpiration: { type: Date, required: true },
}, { timestamps: true, collection: 'referrals' });

ReferralSchema.index({ createdBy: 1 });

export default mongoose.models.Referral || mongoose.model<ReferralDoc & Document>('Referral', ReferralSchema);