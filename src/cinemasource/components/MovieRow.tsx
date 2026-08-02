'use client';

import { useState } from 'react';
import { combineValues } from '../lib/normalize';
import { getShowtimesForMovie, trailerUrl } from '../lib/dates';
import type { ListingMovie } from '../types';
import { useCinemaData } from './CinemaProvider';
import { ShowtimeButtons } from './ShowtimeButtons';

interface MovieRowProps {
  movie: ListingMovie;
  selectedDate: string;
  onPickTickets: (performanceId: string, movieId: string, dateTime: string) => void;
  showBuyButtons?: boolean;
}

export function MovieRow({
  movie,
  selectedDate,
  onPickTickets,
  showBuyButtons = true,
}: MovieRowProps) {
  const { movieData, rtsListingData } = useCinemaData();
  const detail = movieData[movie.movie_id];
  const [expanded, setExpanded] = useState(false);

  if (!detail) {
    return null;
  }

  const showtimes = showBuyButtons
    ? getShowtimesForMovie(movie, selectedDate, rtsListingData)
    : [];

  return (
    <article className="cinema-row grid gap-4 border-b border-zinc-300 py-6 md:grid-cols-12">
      <div className="md:col-span-2">
        <a href={trailerUrl(process.env.NEXT_PUBLIC_TRAILER_BASE_URL ?? 'http://media.westworldmedia.com/thbmb/mp4', movie.movie_id)} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.photos.photo} alt={movie.movie_name} className="w-full max-w-[160px] rounded" />
        </a>
      </div>
      <div className="md:col-span-4">
        <h3 className="text-xl font-semibold text-[#ca0012]">{movie.movie_name}</h3>
        <p className="mt-2 text-sm">
          Rated: {movie.movie_rating}
          <br />
          Runtime: {detail.runtime} minutes
        </p>
        <p className="mt-2 text-sm">Genre: {combineValues(detail.genres.genre)}</p>
        <p className="mt-1 text-sm">Starring: {combineValues(detail.actors.actor)}</p>
        <p className="mt-1 text-sm">Director(s): {combineValues(detail.directors.director)}</p>
      </div>
      {showBuyButtons && (
        <div className="md:col-span-4">
          <ShowtimeButtons
            showtimes={showtimes}
            onSelect={(performanceId, dateTime) =>
              onPickTickets(performanceId, movie.movie_id, dateTime)
            }
          />
        </div>
      )}
      <div className="md:col-span-12">
        <p className="text-sm leading-6 text-zinc-700">
          {expanded ? detail.synopsis : `${detail.synopsis.slice(0, 120)}...`}{' '}
          <button type="button" className="text-[#ca0012] underline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show Less' : 'Show More'}
          </button>
        </p>
      </div>
    </article>
  );
}
