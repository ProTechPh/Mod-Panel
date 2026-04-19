import mongoose, { Schema, Document } from 'mongoose';

interface TelegramAuthLogDoc {
  hash: string;
  createdAt: Date;
}

const TelegramAuthLogSchema = new Schema<TelegramAuthLogDoc & Document>({
  hash: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
}, { collection: 'telegram_auth_logs' });

TelegramAuthLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.TelegramAuthLog || mongoose.model<TelegramAuthLogDoc & Document>('TelegramAuthLog', TelegramAuthLogSchema);