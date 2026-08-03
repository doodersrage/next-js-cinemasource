import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import path from 'path';
import type {
  CinemaListingPayload,
  CinemaModuleConfig,
  DateOpts,
  ListingMovie,
  MovieDetail,
  RtsListing,
  RtsTicket,
} from '../types';
import { fetchMovieDetail, fetchTheaterListing, resolvePosterUrl } from './cinemaSource';
import { mdYToYmd, normalizeList } from './normalize';
import { buildShowTimeXmlRequest, postRtsJson } from './rtsClient';

dayjs.extend(customParseFormat);
import { xmlToObject } from './xml';

function ticketLookup(rtsListing: RtsListing, ticketId: string): RtsTicket | null {
  const tickets = normalizeList(rtsListing.ShowSchedule?.Tickets?.Ticket);
  return tickets.find((ticket) => String(ticket.Code) === String(ticketId)) ?? null;
}

function buildDateOpts(
  movieListing: ListingMovie[],
  rtsListing: RtsListing,
): { dateOpts: DateOpts; soonDateOpts: DateOpts } {
  const selDatesArr: DateOpts = {};
  const soonDatesArr: DateOpts = {};
  const films = normalizeList(rtsListing.ShowSchedule?.Films?.Film);

  for (const movie of movieListing) {
    if (!movie.movie_id) {
      continue;
    }

    for (const film of films) {
      if (String(film.CSCode) !== String(movie.movie_id)) {
        continue;
      }

      const shows = normalizeList(film.Shows?.Show);
      const showEntries =
        film.Shows?.Show && !Array.isArray(film.Shows.Show) && 'DT' in film.Shows.Show
          ? [film.Shows.Show]
          : shows;

      for (const curShow of showEntries) {
        const tickets = normalizeList(curShow.TIs?.TI);
        const ticketEntries =
          curShow.TIs?.TI && !Array.isArray(curShow.TIs.TI) && 'C' in curShow.TIs.TI
            ? [curShow.TIs.TI]
            : tickets;

        const showDate = String(curShow.DT ?? '').slice(0, 8);
        const showtimeEntries = normalizeList(movie.showtimes);
        const normalizedShowtimes =
          movie.showtimes && !Array.isArray(movie.showtimes) && '@attributes' in movie.showtimes
            ? [movie.showtimes]
            : showtimeEntries;

        for (const curShowTime of normalizedShowtimes) {
          const dateAttr = curShowTime['@attributes']?.date;
          if (!dateAttr) {
            continue;
          }

          if (mdYToYmd(dateAttr) !== showDate) {
            continue;
          }

          for (const ti of ticketEntries) {
            const ticket = ticketLookup(rtsListing, ti.C);
            if (ticket && !ticket.HideOnInternet) {
              selDatesArr[dateAttr] = dayjs(dateAttr, 'M/D/YYYY').valueOf();
            } else if (
              ticketEntries.length === 1 &&
              ticket &&
              ticket.HideOnInternet === '1' &&
              ticket.Name === 'rSupersvr'
            ) {
              soonDatesArr[dateAttr] = dayjs(dateAttr, 'M/D/YYYY').valueOf();
            }
          }
        }
      }
    }
  }

  return { dateOpts: selDatesArr, soonDateOpts: soonDatesArr };
}

export async function buildCinemaListing(config: CinemaModuleConfig): Promise<CinemaListingPayload> {
  const { cinemaSource, rts, site } = config;

  if (!cinemaSource.apiKey || !cinemaSource.houseId) {
    throw new Error('Configure CINEMA_SOURCE_API_KEY and CINEMA_SOURCE_HOUSE_ID');
  }

  const rtsXml = await postRtsJson<RtsListing>(rts, buildShowTimeXmlRequest());
  const listingXmlMovies = await fetchTheaterListing(cinemaSource);
  const movieListing = listingXmlMovies.map((movie) =>
    movie.movie_id ? movie : movie,
  );

  const normalizedListing = movieListing.some((movie) => movie.movie_id)
    ? movieListing
    : [];

  const movieData: Record<string, MovieDetail> = {};
  const postersDir =
    site.postersDir ?? path.join(process.cwd(), 'public', 'posters');

  for (const movie of normalizedListing) {
    if (!movie.movie_id) {
      continue;
    }

    const detail = await fetchMovieDetail(cinemaSource, movie.movie_id);
    if (!detail) {
      continue;
    }

    const poster = await resolvePosterUrl(detail, postersDir);
    if (poster) {
      detail.photos = { photo: poster };
    }

    movieData[movie.movie_id] = detail;
  }

  const { dateOpts, soonDateOpts } = buildDateOpts(normalizedListing, rtsXml);
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    dateOpts,
    soonDateOpts,
    listingData: normalizedListing,
    rtsListingData: rtsXml,
    movieData,
    rtsConfig: {
      reqUrl: '/api/rts/proxy',
      sessUrl: '/api/rts/session',
      redirUrl: '/api/rts/redirect',
      processCompleteUrl: site.processCompleteUrl || `${siteOrigin}/api/rts/complete`,
      returnUrl: site.returnUrl || `${siteOrigin}/showtimes?paymentRes=1`,
      convFee: site.convFee,
    },
  };
}

export function parseRtsListingFromXml(xml: string): RtsListing {
  return xmlToObject<RtsListing>(xml);
}
