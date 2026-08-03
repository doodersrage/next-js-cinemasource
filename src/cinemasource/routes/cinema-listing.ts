import { NextResponse } from 'next/server';
import { getCinemaConfig } from '../config';
import { buildCinemaListing } from '../lib/listingBuilder';

export const revalidate = 7200;

export async function GET() {
  try {
    const payload = await buildCinemaListing(getCinemaConfig());
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build listing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
