import mongoose, { Schema, Document } from 'mongoose';

export interface FtpConfigDoc {
  _id: string;
  label: string;
  host: string;
  user: string;
  password: string;
  port: number;
  remotePath: string;
  scanPaths: string[];
  isActive: boolean;
  order: number;
  diskLimit: number;
  inodeLimit: number;
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
  scanPaths: [{ type: String }],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  diskLimit: { type: Number, default: 5 * 1024 * 1024 * 1024 },
  inodeLimit: { type: Number, default: 80000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'ftp_configs' });

FtpConfigSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

export default mongoose.models.FtpConfig || mongoose.model<FtpConfigDoc & Document>('FtpConfig', FtpConfigSchema);
