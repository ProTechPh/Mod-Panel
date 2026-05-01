import mongoose, { Schema, Document } from 'mongoose';

export interface TelegramBotStateDoc extends Document {
  telegramId: number;
  step: string;
  data?: any;
  updatedAt: Date;
}

const TelegramBotStateSchema = new Schema<TelegramBotStateDoc>({
  telegramId: { type: Number, required: true, unique: true },
  step: { type: String, default: 'idle' },
  data: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, collection: 'telegram_bot_states' });

export default mongoose.models.TelegramBotState || mongoose.model<TelegramBotStateDoc>('TelegramBotState', TelegramBotStateSchema);
