'use client';

import { useMemo, useState } from 'react';
import { dateOptionEntries, formatDateOptionLabel, moviesForDate } from '../lib/dates';
import { useCinemaData } from './CinemaProvider';
import { MovieRow } from './MovieRow';

export function MovieListingSoon() {
  const { soonDateOpts, listingData } = useCinemaData();
  const dates = useMemo(() => dateOptionEntries(soonDateOpts), [soonDateOpts]);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.[0] ?? '');

  const movies = useMemo(
    () => moviesForDate(listingData, selectedDate),
    [listingData, selectedDate],
  );

  return (
    <section className="cinema-listing-soon">
      <label className="mb-4 block text-sm font-medium">
        Select date
        <select
          className="mt-1 block w-full max-w-md rounded border border-zinc-300 px-3 py-2"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        >
          {dates.map(([date]) => (
            <option key={date} value={date}>
              {formatDateOptionLabel(date)}
            </option>
          ))}
        </select>
      </label>

      <div>
        {movies.map((movie) => (
          <MovieRow
            key={movie.movie_id}
            movie={movie}
            selectedDate={selectedDate}
            onPickTickets={() => undefined}
            showBuyButtons={false}
          />
        ))}
      </div>
    </section>
  );
}
