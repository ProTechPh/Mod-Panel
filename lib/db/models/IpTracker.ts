import mongoose, { Schema, Document } from 'mongoose';
import type { IpTrackerDoc } from '@/types';

const IpTrackerSchema = new Schema<IpTrackerDoc & Document>({
  userId: { type: String, default: '0' },
  ipAddress: { type: String, required: true },
  generatorIp: { type: String, default: '' },
  keyId: { type: Schema.Types.ObjectId, required: true, ref: 'Key' },
  createdAt: { type: Date, default: Date.now },
  isp: { type: String, default: '' },
  org: { type: String, default: '' },
  isVpn: { type: Boolean, default: false },
  isProxy: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
}, { collection: 'ip_tracker' });

IpTrackerSchema.index({ ipAddress: 1, createdAt: -1 });
IpTrackerSchema.index({ keyId: 1 });
IpTrackerSchema.index({ ipAddress: 1, isBanned: 1 });
IpTrackerSchema.index({ userId: 1 });

export default mongoose.models.IpTracker || mongoose.model<IpTrackerDoc & Document>('IpTracker', IpTrackerSchema);