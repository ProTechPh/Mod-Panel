import mongoose, { Schema, Document } from 'mongoose';

export interface AnnouncementDoc {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<AnnouncementDoc & Document>({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
}, { timestamps: true, collection: 'announcements' });

export default mongoose.models.Announcement || mongoose.model<AnnouncementDoc & Document>('Announcement', AnnouncementSchema);
