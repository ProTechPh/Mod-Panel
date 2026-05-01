import mongoose, { Schema, Document } from 'mongoose';
import type { Duration } from '@/types';

export interface StoreProductDoc {
  _id: mongoose.Types.ObjectId;
  registrator: string;
  game: string;
  label: string;
  duration: Duration;
  maxDevices: number;
  price: number; // in PHP (e.g. 50 = ₱50)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreProductSchema = new Schema<StoreProductDoc & Document>({
  registrator: { type: String, required: true, trim: true },
  game: { type: String, required: true, trim: true, uppercase: true },
  label: { type: String, required: true, trim: true },
  duration: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: (v: Duration) => typeof v === 'number' || v === '1h' || v === '3h',
      message: 'Duration must be a number, "1h", or "3h"',
    },
  },
  maxDevices: { type: Number, required: true, default: 1, min: 1 },
  price: { type: Number, required: true, min: 20 }, // min ₱20 for PayMongo
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'store_products' });

StoreProductSchema.index({ registrator: 1 });
StoreProductSchema.index({ registrator: 1, isActive: 1 });

export default mongoose.models.StoreProduct
  || mongoose.model<StoreProductDoc & Document>('StoreProduct', StoreProductSchema);
