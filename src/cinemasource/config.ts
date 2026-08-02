import type { CinemaModuleConfig } from './types';

export function getCinemaConfig(): CinemaModuleConfig {
  const baseUrl = process.env.CINEMA_SOURCE_BASE_URL ?? 'https://webservice.cinema-source.com';
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    cinemaSource: {
      baseUrl,
      apiVersion: process.env.CINEMA_SOURCE_API_VERSION ?? '4.0',
      apiKey: process.env.CINEMA_SOURCE_API_KEY ?? '',
      houseId: process.env.CINEMA_SOURCE_HOUSE_ID ?? '',
    },
    rts: {
      host: process.env.RTS_HOST ?? '72352.formovietickets.com',
      port: Number(process.env.RTS_PORT ?? 2235),
      username: process.env.RTS_USERNAME ?? '',
      password: process.env.RTS_PASSWORD ?? '',
      useSandbox: process.env.RTS_USE_SANDBOX === 'true',
      sandboxHost: process.env.RTS_SANDBOX_HOST ?? '5.formovietickets.com',
      sandboxUsername: process.env.RTS_SANDBOX_USERNAME ?? 'test',
      sandboxPassword: process.env.RTS_SANDBOX_PASSWORD ?? 'test',
      verifySsl: process.env.RTS_VERIFY_SSL === 'true',
    },
    site: {
      processCompleteUrl:
        process.env.SITE_PROCESS_COMPLETE_URL ?? `${siteOrigin}/api/rts/complete`,
      returnUrl: process.env.SITE_RETURN_URL ?? `${siteOrigin}/showtimes?paymentRes=1`,
      convFee: Number(process.env.CONVENIENCE_FEE ?? 1.35),
      trailerBaseUrl:
        process.env.TRAILER_BASE_URL ?? 'http://media.westworldmedia.com/thbmb/mp4',
    },
  };
}
