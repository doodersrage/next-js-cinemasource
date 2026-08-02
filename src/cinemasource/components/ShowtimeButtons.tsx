'use client';

import type { ShowtimeOption } from '../types';

interface ShowtimeButtonsProps {
  showtimes: ShowtimeOption[];
  onSelect: (performanceId: string, dateTime: string) => void;
}

export function ShowtimeButtons({ showtimes, onSelect }: ShowtimeButtonsProps) {
  if (showtimes.length === 0) {
    return null;
  }

  return (
    <div className="buy-tickets">
      <p className="mb-2 text-sm">Select a movie time to buy tickets online now</p>
      <div className="flex flex-wrap gap-2">
        {showtimes.map((showtime) => (
          <button
            key={showtime.performanceId}
            type="button"
            className="rounded border border-[#ca0012] px-3 py-1 text-sm text-[#ca0012] hover:bg-[#ca0012] hover:text-white"
            onClick={() => onSelect(showtime.performanceId, showtime.dateTime)}
          >
            {showtime.label}
          </button>
        ))}
      </div>
    </div>
  );
}
