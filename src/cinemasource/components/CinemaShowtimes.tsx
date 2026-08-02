'use client';

import { useEffect, useState } from 'react';
import type { CinemaListingPayload } from '../types';
import { CinemaProvider } from './CinemaProvider';
import { MovieGallery } from './MovieGallery';
import { MovieGallerySoon } from './MovieGallerySoon';
import { MovieListing } from './MovieListing';
import { MovieListingSoon } from './MovieListingSoon';
import { TicketPurchaseModal } from './TicketPurchaseModal';

type ViewMode = 'listing' | 'listing-soon' | 'gallery' | 'gallery-soon';

interface CinemaShowtimesProps {
  data: CinemaListingPayload;
  initialView?: ViewMode;
}

export function CinemaShowtimes({ data, initialView = 'listing' }: CinemaShowtimesProps) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentResultOpen, setPaymentResultOpen] = useState(false);
  const [selection, setSelection] = useState({
    movieId: '',
    performanceId: '',
    selTime: '',
  });

  function handlePickTickets(performanceId: string, movieId: string, selTime: string) {
    setSelection({ performanceId, movieId, selTime });
    setModalOpen(true);
    setPaymentResultOpen(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paymentRes') === '1') {
      setPaymentResultOpen(true);
    }
  }, []);

  return (
    <CinemaProvider value={data}>
      <div className="cinema-module mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            ['listing', 'Current Listings'],
            ['gallery', 'Gallery'],
            ['listing-soon', 'Coming Soon'],
            ['gallery-soon', 'Coming Soon Gallery'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`rounded px-4 py-2 text-sm ${view === mode ? 'bg-[#ca0012] text-white' : 'border border-zinc-300'}`}
              onClick={() => setView(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'listing' && <MovieListing onPickTickets={handlePickTickets} />}
        {view === 'listing-soon' && <MovieListingSoon />}
        {view === 'gallery' && <MovieGallery onPickTickets={handlePickTickets} />}
        {view === 'gallery-soon' && <MovieGallerySoon />}

        <TicketPurchaseModal
          open={modalOpen || paymentResultOpen}
          onClose={() => {
            setModalOpen(false);
            setPaymentResultOpen(false);
          }}
          movieId={selection.movieId}
          performanceId={selection.performanceId}
          selTime={selection.selTime}
          movieData={data.movieData}
          rtsListing={data.rtsListingData}
          rtsConfig={data.rtsConfig}
          showPaymentResult={paymentResultOpen}
        />
      </div>
    </CinemaProvider>
  );
}
