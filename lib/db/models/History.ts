import mongoose, { Schema, Document } from 'mongoose';
import type { HistoryDoc } from '@/types';

const HistorySchema = new Schema<HistoryDoc & Document>({
  keyId: { type: String, required: true },
  userDo: { type: String, required: true, trim: true },
  info: { type: String, default: '' },
}, { timestamps: true, collection: 'history' });

HistorySchema.index({ userDo: 1 });
HistorySchema.index({ createdAt: -1 });
HistorySchema.index({ keyId: 1 });

export default mongoose.models.History || mongoose.model<HistoryDoc & Document>('History', HistorySchema);