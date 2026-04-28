import dbConnect from '@/lib/db/connection';
import Store from '@/lib/db/models/Store';
import StoreProduct from '@/lib/db/models/StoreProduct';
import Order from '@/lib/db/models/Order';
import type { Duration } from '@/types';

// ─── Store ─────────────────────────────────────────────────────────────────

export async function getStore(registrator: string) {
  await dbConnect();
  const store = await Store.findOne({ registrator }).lean();
  if (!store) return null;
  return {
    ...store,
    _id: store._id.toString(),
    createdAt: store.createdAt?.toISOString(),
    updatedAt: store.updatedAt?.toISOString(),
  };
}

export async function upsertStore(registrator: string, data: {
  storeName: string;
  storeDescription?: string;
  isActive?: boolean;
}) {
  await dbConnect();
  const store = await Store.findOneAndUpdate(
    { registrator },
    {
      registrator,
      storeName: data.storeName,
      storeDescription: data.storeDescription ?? '',
      isActive: data.isActive ?? true,
    },
    { upsert: true, new: true }
  ).lean();
  return store ? { ...store, _id: store._id.toString() } : null;
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function listProducts(registrator: string, activeOnly = true) {
  await dbConnect();
  const filter: Record<string, unknown> = { registrator };
  if (activeOnly) filter.isActive = true;
  const products = await StoreProduct.find(filter).sort({ price: 1 }).lean();
  return products.map(p => ({
    ...p,
    _id: p._id.toString(),
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  }));
}

export async function addProduct(registrator: string, data: {
  game: string;
  label: string;
  duration: Duration;
  maxDevices: number;
  price: number;
}) {
  await dbConnect();
  const product = await StoreProduct.create({
    registrator,
    game: data.game.toUpperCase(),
    label: data.label,
    duration: data.duration,
    maxDevices: data.maxDevices,
    price: data.price,
    isActive: true,
  });
  return { ...product.toObject(), _id: product._id.toString() };
}

export async function updateProduct(id: string, registrator: string, data: {
  label?: string;
  price?: number;
  maxDevices?: number;
  isActive?: boolean;
  game?: string;
  duration?: Duration;
}) {
  await dbConnect();
  const update: Record<string, unknown> = {};
  if (data.label !== undefined) update.label = data.label;
  if (data.price !== undefined) update.price = data.price;
  if (data.maxDevices !== undefined) update.maxDevices = data.maxDevices;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.game !== undefined) update.game = data.game.toUpperCase();
  if (data.duration !== undefined) update.duration = data.duration;

  const product = await StoreProduct.findOneAndUpdate(
    { _id: id, registrator },
    update,
    { new: true }
  ).lean();
  return product ? { ...product, _id: product._id.toString() } : null;
}

export async function deleteProduct(id: string, registrator: string) {
  await dbConnect();
  const result = await StoreProduct.deleteOne({ _id: id, registrator });
  return result.deletedCount > 0;
}

export async function getProduct(id: string) {
  await dbConnect();
  const product = await StoreProduct.findById(id).lean();
  if (!product) return null;
  return { ...product, _id: product._id.toString() };
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function createOrder(data: {
  registrator: string;
  productId: string;
  game: string;
  label: string;
  duration: Duration;
  maxDevices: number;
  price: number;
  buyerName?: string;
  paymongoCheckoutSessionId?: string;
}) {
  await dbConnect();
  const order = await Order.create({
    registrator: data.registrator,
    productId: data.productId,
    game: data.game,
    label: data.label,
    duration: data.duration,
    maxDevices: data.maxDevices,
    price: data.price,
    buyerName: data.buyerName || '',
    paymongoCheckoutSessionId: data.paymongoCheckoutSessionId || '',
    status: 'pending',
    generatedKey: null,
  });
  return { ...order.toObject(), _id: order._id.toString() };
}

export async function getOrderById(id: string) {
  await dbConnect();
  const order = await Order.findById(id).lean();
  if (!order) return null;
  return {
    ...order,
    _id: order._id.toString(),
    productId: order.productId?.toString(),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString(),
  };
}

export async function getOrderBySessionId(sessionId: string) {
  await dbConnect();
  const order = await Order.findOne({ paymongoCheckoutSessionId: sessionId }).lean();
  if (!order) return null;
  return {
    ...order,
    _id: order._id.toString(),
    productId: order.productId?.toString(),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString(),
  };
}

export async function markOrderPaid(orderId: string, generatedKey: string, paymentIntentId?: string) {
  await dbConnect();
  const update: Record<string, unknown> = { status: 'paid', generatedKey };
  if (paymentIntentId) update.paymongoPaymentIntentId = paymentIntentId;
  const order = await Order.findByIdAndUpdate(orderId, update, { new: true }).lean();
  return order ? { ...order, _id: order._id.toString() } : null;
}

export async function markOrderFailed(orderId: string) {
  await dbConnect();
  await Order.findByIdAndUpdate(orderId, { status: 'failed' });
}

export async function listOrders(registrator: string, limit = 50) {
  await dbConnect();
  const orders = await Order.find({ registrator })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return orders.map(o => ({
    ...o,
    _id: o._id.toString(),
    productId: o.productId?.toString(),
    createdAt: o.createdAt?.toISOString(),
    updatedAt: o.updatedAt?.toISOString(),
  }));
}
