'use client';

import { useMemo } from 'react';
import { combineValues } from '../lib/normalize';
import { dateOptionEntries, formatDateOptionLabel, moviesForDate } from '../lib/dates';
import { useCinemaData } from './CinemaProvider';

export function MovieGallerySoon() {
  const { soonDateOpts, listingData, movieData } = useCinemaData();
  const dates = useMemo(() => dateOptionEntries(soonDateOpts), [soonDateOpts]);

  return (
    <section className="cinema-gallery-soon space-y-8">
      {dates.map(([date]) => {
        const movies = moviesForDate(listingData, date);

        return (
          <div key={date}>
            <h3 className="mb-4 text-lg font-semibold text-[#ca0012]">{formatDateOptionLabel(date)}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {movies.map((movie) => {
                const detail = movieData[movie.movie_id];
                if (!detail) {
                  return null;
                }

                return (
                  <article key={`${date}-${movie.movie_id}`} className="flex gap-4 rounded border border-zinc-200 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detail.photos.photo} alt={movie.movie_name} className="h-40 w-[135px] object-cover" />
                    <div>
                      <h4 className="font-semibold">{movie.movie_name}</h4>
                      <p className="mt-2 text-sm">{combineValues(detail.genres.genre)}</p>
                      <p className="mt-2 text-sm leading-6">{detail.synopsis.slice(0, 160)}...</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
