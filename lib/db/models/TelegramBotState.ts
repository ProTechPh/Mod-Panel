import mongoose, { Schema, Document } from 'mongoose';

export interface TelegramBotStateDoc extends Document {
  telegramId: number;
  step: string;
  data?: any;
  hasClaimed: boolean;
  updatedAt: Date;
}

const TelegramBotStateSchema = new Schema<TelegramBotStateDoc>({
  telegramId: { type: Number, required: true, unique: true },
  step: { type: String, default: 'idle' },
  data: { type: Schema.Types.Mixed, default: {} },
  hasClaimed: { type: Boolean, default: false },
}, { timestamps: true, collection: 'telegram_bot_states' });

export default mongoose.models.TelegramBotState || mongoose.model<TelegramBotStateDoc>('TelegramBotState', TelegramBotStateSchema);
