import { NextResponse } from 'next/server';
import { getCinemaConfig } from '../config';
import { postRtsJson } from '../lib/rtsClient';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { req?: string };
    if (!body.req) {
      return NextResponse.json({ error: 'Missing request payload' }, { status: 400 });
    }

    const result = await postRtsJson(getCinemaConfig().rts, body.req);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RTS proxy failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
