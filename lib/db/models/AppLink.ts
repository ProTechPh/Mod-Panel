import mongoose, { Schema, Document } from 'mongoose';
import type { AppLinkDoc } from '@/types';

const AppLinkSchema = new Schema<AppLinkDoc & Document>({
  appName: { type: String, required: true, trim: true },
  downloadUrl: { type: String, required: true, trim: true },
}, { timestamps: true, collection: 'app_links' });

export default mongoose.models.AppLink || mongoose.model<AppLinkDoc & Document>('AppLink', AppLinkSchema);