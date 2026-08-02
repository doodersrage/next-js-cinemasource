import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { CheckoutSession } from '../types';

export interface SessionData {
  checkout?: CheckoutSession;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'complex_password_at_least_32_characters_long',
  cookieName: 'cinemasource_checkout',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

export async function getCheckoutSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
