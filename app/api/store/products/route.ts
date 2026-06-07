import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import {
  listProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/services/store-service';
import type { Duration } from '@/types';
import { Logger } from '@/lib/utils';

// GET /api/store/products?registrator=xxx  — public
// GET /api/store/products                   — authenticated (all including inactive)
export async function GET(request: NextRequest) {
  const registratorParam = request.nextUrl.searchParams.get('registrator');

  if (registratorParam) {
    const products = await listProducts(registratorParam, true);
    return NextResponse.json(products);
  }

  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const products = await listProducts(user.username, false);
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    if (body._method === 'DELETE') {
      if (!body.id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
      const deleted = await deleteProduct(body.id, user.username);
      if (!deleted) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const product = await updateProduct(body.id, user.username, {
        label: body.label,
        price: body.price,
        maxDevices: body.maxDevices,
        isActive: body.isActive,
        game: body.game,
        duration: body.duration as Duration,
      });
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json(product);
    }

    const { game, label, duration, maxDevices, price } = body;
    if (!game || !label || duration === undefined || !price) {
      return NextResponse.json({ error: 'Missing required fields: game, label, duration, price' }, { status: 400 });
    }
    if (price < 20) {
      return NextResponse.json({ error: 'Minimum price is ₱20' }, { status: 400 });
    }

    const product = await addProduct(user.username, {
      game,
      label,
      duration: duration as Duration,
      maxDevices: maxDevices ?? 1,
      price,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    Logger.error('Store products error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
