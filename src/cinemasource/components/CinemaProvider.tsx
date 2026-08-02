'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CinemaListingPayload } from '../types';

const CinemaContext = createContext<CinemaListingPayload | null>(null);

export function CinemaProvider({
  value,
  children,
}: {
  value: CinemaListingPayload;
  children: ReactNode;
}) {
  return <CinemaContext.Provider value={value}>{children}</CinemaContext.Provider>;
}

export function useCinemaData(): CinemaListingPayload {
  const context = useContext(CinemaContext);
  if (!context) {
    throw new Error('useCinemaData must be used within CinemaProvider');
  }
  return context;
}
