import mongoose, { Schema, Document } from 'mongoose';
import type { LibDoc } from '@/types';

const LibSchema = new Schema<LibDoc & Document>({
  fileName: { type: String, required: true, trim: true, unique: true },
  displayName: { type: String, required: true, trim: true },
  ftpUrl: { type: String, required: true },
  fileSize: { type: String, default: '' },
  fileSizeBytes: { type: Number, default: 0 },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { collection: 'libs' });

LibSchema.index({ fileName: 1 }, { unique: true });
LibSchema.index({ uploadedAt: -1 });
LibSchema.index({ uploadedBy: 1 });

export default mongoose.models.Lib || mongoose.model<LibDoc & Document>('Lib', LibSchema);