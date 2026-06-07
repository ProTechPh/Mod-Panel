import mongoose, { Schema, Document } from 'mongoose';

export interface StoreDoc {
  _id: mongoose.Types.ObjectId;
  registrator: string;
  storeName: string;
  storeDescription: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<StoreDoc & Document>({
  registrator: { type: String, required: true, unique: true, trim: true },
  storeName: { type: String, required: true, trim: true },
  storeDescription: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'stores' });

export default mongoose.models.Store
  || mongoose.model<StoreDoc & Document>('Store', StoreSchema);
