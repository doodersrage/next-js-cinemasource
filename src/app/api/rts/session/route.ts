import { NextResponse } from 'next/server';
import { getCheckoutSession } from '@/cinemasource/lib/session';
import type { CheckoutSession } from '@/cinemasource/types';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    method?: 'set' | 'get';
    data?: CheckoutSession | Record<string, never>;
  };

  const session = await getCheckoutSession();

  if (body.method === 'set') {
    session.checkout = body.data as CheckoutSession;
    await session.save();
    return NextResponse.json({ status: 'saved' });
  }

  if (body.method === 'get') {
    return NextResponse.json(session.checkout ?? null);
  }

  return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
}
