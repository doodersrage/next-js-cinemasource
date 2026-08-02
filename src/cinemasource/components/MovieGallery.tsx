'use client';

import { useMemo, useState } from 'react';
import { combineValues } from '../lib/normalize';
import { dateOptionEntries, formatDateOptionLabel, getShowtimesForMovie, moviesForDate } from '../lib/dates';
import { useCinemaData } from './CinemaProvider';
import { ShowtimeButtons } from './ShowtimeButtons';

interface MovieGalleryProps {
  onPickTickets: (performanceId: string, movieId: string, dateTime: string) => void;
}

export function MovieGallery({ onPickTickets }: MovieGalleryProps) {
  const { dateOpts, listingData, movieData, rtsListingData } = useCinemaData();
  const dates = useMemo(() => dateOptionEntries(dateOpts), [dateOpts]);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.[0] ?? '');
  const [activeMovieId, setActiveMovieId] = useState<string | null>(null);

  const movies = useMemo(
    () => moviesForDate(listingData, selectedDate),
    [listingData, selectedDate],
  );

  const activeMovie = movies.find((movie) => movie.movie_id === activeMovieId) ?? movies[0] ?? null;
  const activeDetail = activeMovie ? movieData[activeMovie.movie_id] : null;

  return (
    <section className="cinema-gallery">
      <label className="mb-4 block text-sm font-medium">
        Select date
        <select
          className="mt-1 block w-full max-w-md rounded border border-zinc-300 px-3 py-2"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(event.target.value);
            setActiveMovieId(null);
          }}
        >
          {dates.map(([date]) => (
            <option key={date} value={date}>
              {formatDateOptionLabel(date)}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {movies.map((movie) => {
          const detail = movieData[movie.movie_id];
          if (!detail) {
            return null;
          }

          return (
            <button
              key={movie.movie_id}
              type="button"
              className={`shrink-0 rounded border p-1 ${activeMovie?.movie_id === movie.movie_id ? 'border-[#ca0012]' : 'border-transparent'}`}
              onClick={() => setActiveMovieId(movie.movie_id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detail.photos.photo} alt={movie.movie_name} className="h-40 w-[135px] object-cover" />
            </button>
          );
        })}
      </div>

      {activeMovie && activeDetail && (
        <div className="rounded border border-zinc-200 p-4">
          <h3 className="text-xl font-semibold text-[#ca0012]">{activeMovie.movie_name}</h3>
          <p className="mt-2 text-sm">
            Rated: {activeMovie.movie_rating}
            <br />
            Runtime: {activeDetail.runtime} minutes
          </p>
          <p className="mt-2 text-sm">Genre: {combineValues(activeDetail.genres.genre)}</p>
          <p className="mt-1 text-sm">Starring: {combineValues(activeDetail.actors.actor)}</p>
          <p className="mt-1 text-sm">Director(s): {combineValues(activeDetail.directors.director)}</p>
          <ShowtimeButtons
            showtimes={getShowtimesForMovie(activeMovie, selectedDate, rtsListingData)}
            onSelect={(performanceId, dateTime) =>
              onPickTickets(performanceId, activeMovie.movie_id, dateTime)
            }
          />
          <p className="mt-4 text-sm leading-6">{activeDetail.synopsis}</p>
        </div>
      )}
    </section>
  );
}
