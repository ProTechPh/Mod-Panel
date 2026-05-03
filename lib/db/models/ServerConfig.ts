import mongoose, { Schema, Document } from 'mongoose';
import type { ServerConfigDoc, MaintenanceStatus } from '@/types';
import { SERVER_CONFIG_ID } from '@/types';

const ServerConfigSchema = new Schema<ServerConfigDoc & Document>({
  _id: { type: String, default: SERVER_CONFIG_ID },
  modName: { type: String, default: '' },
  maintenanceStatus: { type: String, enum: ['on', 'off'] as MaintenanceStatus[], default: 'off' },
  maintenanceMessage: { type: String, default: '' },
  maintenanceStartedAt: { type: Date, default: null },
  announcement: { type: String, default: '' },
  announcementStatus: { type: String, enum: ['on', 'off'], default: 'off' },
  telegramChannel: { type: String, default: '' },
  telegramGroup: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'server_config', _id: false });

ServerConfigSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

export const SingletonId = SERVER_CONFIG_ID;

export default mongoose.models.ServerConfig || mongoose.model<ServerConfigDoc & Document>('ServerConfig', ServerConfigSchema);