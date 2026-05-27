import mongoose, { Schema, Document } from 'mongoose';
import type { LibLogDoc } from '@/types';

const LibraryLogSchema = new Schema<LibLogDoc & Document>({
  libId: { type: Schema.Types.ObjectId, required: true, ref: 'Lib' },
  fileName: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, default: '' },
  device: { type: String, default: '' },
  downloadedAt: { type: Date, default: Date.now },
}, { collection: 'library_logs' });

LibraryLogSchema.index({ libId: 1, downloadedAt: -1 });
LibraryLogSchema.index({ uploadedBy: 1, downloadedAt: -1 });

export default mongoose.models.LibraryLog || mongoose.model<LibLogDoc & Document>('LibraryLog', LibraryLogSchema);
