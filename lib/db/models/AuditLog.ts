import mongoose, { Schema, Document } from 'mongoose';

export interface AuditLogDoc extends Document {
  action: string;
  actor: string;
  actorLevel: number;
  target: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc & Document>({
  action: {
    type: String,
    required: true,
    enum: [
      'key.generate',
      'key.delete',
      'key.extend',
      'key.reset',
      'key.bulk_delete',
      'user.create',
      'user.delete',
      'user.update',
      'game_settings.update',
      'store.order_delete',
      'auth.login',
      'auth.failed_login',
      'system.maintenance',
    ],
  },
  actor: { type: String, required: true, trim: true },
  actorLevel: { type: Number, required: true, enum: [1, 2, 3] },
  target: { type: String, default: '' },
  details: { type: Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'audit_logs' });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<AuditLogDoc & Document>('AuditLog', AuditLogSchema);
