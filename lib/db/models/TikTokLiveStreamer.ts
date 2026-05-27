import mongoose, { Schema, Document } from 'mongoose';
import type { TikTokLiveStreamerDoc } from '@/types';

const TikTokLiveStreamerSchema = new Schema<TikTokLiveStreamerDoc & Document>({
  key: { type: String, required: true, unique: true, trim: true },
  tiktokUsername: { type: String, required: true, trim: true },
  streamerName: { type: String, default: '' },
  contact: { type: String, default: '' },
  status: { type: String, required: true, enum: ['pending', 'active', 'inactive', 'expired'], default: 'pending' },
  registrator: { type: String, required: true, trim: true },
  liveDuration: { type: Number, default: 0 },
  lastLive: { type: Date, default: null },
  lastLiveDuration: { type: Number, default: 0 },
  autoExtendEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'tiktok_live_streamers' });

TikTokLiveStreamerSchema.index({ registrator: 1 });
TikTokLiveStreamerSchema.index({ tiktokUsername: 1 });
TikTokLiveStreamerSchema.index({ status: 1 });
TikTokLiveStreamerSchema.index({ lastLive: 1 });
TikTokLiveStreamerSchema.index({ registrator: 1, status: 1 });

export default mongoose.models.TikTokLiveStreamer || mongoose.model<TikTokLiveStreamerDoc & Document>('TikTokLiveStreamer', TikTokLiveStreamerSchema);
