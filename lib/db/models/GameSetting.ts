import mongoose, { Schema, Document } from 'mongoose';
import type { GameSettingDoc } from '@/types';

const GameSettingSchema = new Schema<GameSettingDoc & Document>({
  gameCode: { type: String, required: true, trim: true, uppercase: true },
  gameName: { type: String, required: true, trim: true },
  isEnabled: { type: Boolean, default: true },
  connectEnabled: { type: Boolean, default: true },
  freeKeyEnabled: { type: Boolean, default: true },
  maintenanceMessage: { type: String, default: '' },
  maintenanceStartedAt: { type: Date, default: null },
  downloadLink: { type: String, default: '' },
  modName: { type: String, default: '' },
  telegramChannel: { type: String, default: '' },
  telegramGroup: { type: String, default: '' },
  registrator: { type: String, required: true },
  announcement: { type: String, default: '' },
  announcementStatus: { type: String, enum: ['on', 'off'], default: 'off' },
}, { timestamps: true, collection: 'game_settings' });

GameSettingSchema.index({ gameCode: 1, registrator: 1 }, { unique: true });
GameSettingSchema.index({ registrator: 1 });
GameSettingSchema.index({ gameCode: 1 });
GameSettingSchema.index({ isEnabled: 1, registrator: 1 });
GameSettingSchema.index({ maintenanceStartedAt: 1 });

export default mongoose.models.GameSetting || mongoose.model<GameSettingDoc & Document>('GameSetting', GameSettingSchema);