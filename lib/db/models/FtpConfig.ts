import mongoose, { Schema, Document } from 'mongoose';

export interface FtpConfigDoc {
  _id: string;
  label: string;
  host: string;
  user: string;
  password: string;
  port: number;
  remotePath: string;
  libBaseUrl: string;
  statsUrl: string;
  scanPaths: string[];
  isActive: boolean;
  isLibStorage: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FtpConfigSchema = new Schema<FtpConfigDoc & Document>({
  host: { type: String, required: true },
  user: { type: String, required: true },
  password: { type: String, required: true },
  port: { type: Number, default: 21 },
  label: { type: String, default: '' },
  remotePath: { type: String, default: '/htdocs/' },
  libBaseUrl: { type: String, default: '' },
  statsUrl: { type: String, default: '' },
  scanPaths: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isLibStorage: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'ftp_configs' });

FtpConfigSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

export default mongoose.models.FtpConfig || mongoose.model<FtpConfigDoc & Document>('FtpConfig', FtpConfigSchema);
