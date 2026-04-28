import mongoose, { Schema, Document } from 'mongoose';
import type { KeyDoc, KeyStatus, Duration } from '@/types';

const KeySchema = new Schema<KeyDoc & Document>({
  game: { type: String, required: true, trim: true },
  userKey: { type: String, required: true, unique: true, trim: true },
  duration: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: (v: Duration) => typeof v === 'number' || v === '1h' || v === '6h',
      message: 'Duration must be a number, "1h", or "6h"',
    },
  },
  expiredDate: { type: Date, default: null },
  maxDevices: { type: Number, required: true, default: 1 },
  devices: { type: [String], default: [] },
  status: { type: Number, required: true, enum: [0, 1] as KeyStatus[], default: 1 },
  registrator: { type: String, required: true, trim: true },
  isFreeKey: { type: Boolean, default: false },
  deviceResetCount: { type: Number, default: 0 },
}, { timestamps: true, collection: 'keys' });

KeySchema.index({ game: 1, userKey: 1 }, { unique: true });
KeySchema.index({ registrator: 1 });
KeySchema.index({ status: 1 });
KeySchema.index({ expiredDate: 1 });
KeySchema.index({ createdAt: -1 });
KeySchema.index({ devices: 1 });
KeySchema.index({ registrator: 1, status: 1 });

export default mongoose.models.Key || mongoose.model<KeyDoc & Document>('Key', KeySchema);