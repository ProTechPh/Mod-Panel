import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import type { Duration } from '@/types';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface OrderDoc {
  _id: ObjectId;
  registrator: string;
  productId: ObjectId;
  game: string;
  label: string;
  duration: Duration;
  maxDevices: number;
  price: number;
  paymongoCheckoutSessionId: string;
  paymongoPaymentIntentId: string;
  status: OrderStatus;
  generatedKey: string | null;
  buyerName: string;
  buyerUsername: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<OrderDoc & Document>({
  registrator: { type: String, required: true, trim: true },
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'StoreProduct' },
  game: { type: String, required: true },
  label: { type: String, required: true },
  duration: { type: Schema.Types.Mixed, required: true },
  maxDevices: { type: Number, required: true },
  price: { type: Number, required: true },
  paymongoCheckoutSessionId: { type: String, default: '' },
  paymongoPaymentIntentId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'expired'] as OrderStatus[],
    default: 'pending',
  },
  generatedKey: { type: String, default: null },
  buyerName: { type: String, default: '' },
  buyerUsername: { type: String, default: '' },
}, { timestamps: true, collection: 'store_orders' });

OrderSchema.index({ registrator: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymongoCheckoutSessionId: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order
  || mongoose.model<OrderDoc & Document>('Order', OrderSchema);
