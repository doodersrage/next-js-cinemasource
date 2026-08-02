import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { ListingMovie, RtsFilm, RtsListing, RtsShow, ShowtimeOption } from '../types';
import { normalizeList } from './normalize';

dayjs.extend(customParseFormat);

export function moviesForDate(listingData: ListingMovie[], selectedDate: string): ListingMovie[] {
  const results: ListingMovie[] = [];

  for (const movie of listingData) {
    const showtimes = normalizeList(movie.showtimes);
    const entries =
      movie.showtimes && !Array.isArray(movie.showtimes) && '@attributes' in movie.showtimes
        ? [movie.showtimes]
        : showtimes;

    if (entries.some((entry) => entry['@attributes']?.date === selectedDate)) {
      results.push(movie);
    }
  }

  return results;
}

export function getShowtimesForMovie(
  movie: ListingMovie,
  selectedDate: string,
  rtsListing: RtsListing,
): ShowtimeOption[] {
  const films = normalizeList(rtsListing.ShowSchedule?.Films?.Film) as RtsFilm[];
  const selectedYmd = dayjs(selectedDate, 'M/D/YYYY').format('YYYYMMDD');
  const options: ShowtimeOption[] = [];

  for (const film of films) {
    if (String(film.CSCode) !== String(movie.movie_id)) {
      continue;
    }

    const shows = normalizeList(film.Shows?.Show) as RtsShow[];
    const showEntries =
      film.Shows?.Show && !Array.isArray(film.Shows.Show) && 'DT' in film.Shows.Show
        ? [film.Shows.Show]
        : shows;

    for (const show of showEntries) {
      const showDate = String(show.DT ?? '');
      if (showDate.slice(0, 8) !== selectedYmd) {
        continue;
      }

      const showMoment = dayjs(showDate, 'YYYYMMDDHHmm');
      if (!showMoment.isAfter(dayjs())) {
        continue;
      }

      const label = showMoment.format('h:mm A');
      const dateTime = showMoment.format('dddd, MMMM D, YYYY h:mm A');
      options.push({
        performanceId: String(show.ID),
        label,
        dateTime,
      });
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function formatDateOptionLabel(date: string): string {
  return dayjs(date, 'M/D/YYYY').format('dddd, MMMM D, YYYY');
}

export function dateOptionEntries(dateOpts: Record<string, number>): [string, number][] {
  return Object.entries(dateOpts).sort(([, a], [, b]) => a - b);
}

export function trailerUrl(baseUrl: string, movieId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${movieId}_high.mp4`;
}
