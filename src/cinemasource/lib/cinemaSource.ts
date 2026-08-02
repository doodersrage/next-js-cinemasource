import fs from 'fs/promises';
import path from 'path';
import type { CinemaSourceConfig, ListingMovie, MovieDetail } from '../types';
import { xmlToObject } from './xml';

function buildUrl(config: CinemaSourceConfig, params: Record<string, string>): string {
  const query = new URLSearchParams({ apikey: config.apiKey, ...params });
  return `${config.baseUrl.replace(/\/$/, '')}/${encodeURIComponent(config.apiVersion)}/?${query}`;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Cinema Source request failed (${response.status})`);
  }

  return response.text();
}

export async function fetchTheaterListing(config: CinemaSourceConfig): Promise<ListingMovie[]> {
  const startDate = formatDate(new Date());
  const endDate = formatDate(addMonths(new Date(), 4));
  const url = buildUrl(config, {
    query: 'theater',
    schedule: 'yes',
    house_id: config.houseId,
    sd: 'yes',
    showdate: startDate,
    enddate: endDate,
  });

  const xml = await fetchText(url);
  const data = xmlToObject<{ house?: { schedule?: { movie?: ListingMovie | ListingMovie[] } } }>(xml);
  const movies = data.house?.schedule?.movie;

  if (!movies) {
    return [];
  }

  return Array.isArray(movies) ? movies : [movies];
}

export async function fetchMovieDetail(
  config: CinemaSourceConfig,
  movieId: string,
): Promise<MovieDetail | null> {
  const url = buildUrl(config, {
    query: 'movie',
    stars: 'yes',
    photos: 'all',
    movie_id: movieId.trim(),
  });

  const xml = await fetchText(url);
  const data = xmlToObject<{ movie?: MovieDetail }>(xml);
  return data.movie ?? null;
}

export async function resolvePosterUrl(movie: MovieDetail, postersDir: string): Promise<string | null> {
  const filename = sanitizeFilename(movie.name) + '.jpg';
  const localPath = path.join(postersDir, filename);
  const publicPath = `/posters/${filename}`;

  try {
    await fs.access(localPath);
    return publicPath;
  } catch {
    // continue to download
  }

  const remoteUrl = pickPosterUrl(movie);
  if (!remoteUrl) {
    return null;
  }

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    return remoteUrl;
  }

  await fs.mkdir(postersDir, { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(localPath, buffer);

  return publicPath;
}

function pickPosterUrl(movie: MovieDetail): string | null {
  const hi = movie.hiphotos?.photo;
  if (Array.isArray(hi)) {
    return hi[0] ?? null;
  }
  if (typeof hi === 'string' && hi) {
    return hi;
  }

  const photos = movie.photos?.photo;
  if (Array.isArray(photos)) {
    return photos[0] ?? null;
  }
  if (typeof photos === 'string' && photos) {
    return photos;
  }

  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9-]+/g, '_').replace(/_+/g, '_');
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}
