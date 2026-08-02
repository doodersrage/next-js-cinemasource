# next-js-cinemasource

Next.js module for **Cinema Source (Webedia)** showtime data and **RTS POS** online ticketing. Ported from the Concrete CMS blocks in [`concrete57-rts-cinemasource-blocks`](https://github.com/doodersrage/concrete-cms-rts-cinemasource-blocks).

## Features

- Cinema Source theater schedule + movie detail fetching (HTTPS, API v4.0 by default)
- RTS POS integration (`ShowTimeXml`, `CheckSoldOut`, `CreatePayment`, `Buy`)
- React components for listings, galleries, coming-soon views, and ticket checkout
- API routes replacing the legacy `/rts/*.php` proxy scripts
- Poster caching to `public/posters/`

## Quick start

```bash
cp .env.example .env.local
# fill in Cinema Source + RTS credentials

npm install
npm run dev
```

Open [http://localhost:3000/showtimes](http://localhost:3000/showtimes).

## Module usage

Import the module from `src/cinemasource`:

```tsx
import { CinemaShowtimes, buildCinemaListing, getCinemaConfig } from '@/cinemasource';

const data = await buildCinemaListing(getCinemaConfig());

export default function Page() {
  return <CinemaShowtimes data={data} initialView="listing" />;
}
```

### Exported components

| Export | Description |
|--------|-------------|
| `CinemaShowtimes` | All-in-one demo shell with view switcher + checkout modal |
| `MovieListing` | Current showtimes list |
| `MovieListingSoon` | Coming-soon list |
| `MovieGallery` | Poster carousel + detail panel |
| `MovieGallerySoon` | Coming-soon gallery |
| `TicketPurchaseModal` | RTS checkout flow |
| `CinemaProvider` / `useCinemaData` | Context for listing payload |

### Server utilities

| Export | Description |
|--------|-------------|
| `buildCinemaListing()` | Fetch Cinema Source + RTS and build normalized payload |
| `getCinemaConfig()` | Load config from environment variables |

## API routes

| Route | Replaces | Purpose |
|-------|----------|---------|
| `GET /api/cinema/listing` | `listingcache.js` | Full listing payload (cached 2h) |
| `POST /api/rts/proxy` | `rts/req.php` | RTS XML proxy |
| `POST /api/rts/session` | `rts/sess.php` | Checkout session storage |
| `GET /api/rts/redirect` | `rts/redir.php` | Payment processor redirect form |
| `POST /api/rts/complete` | `rts/procComp.php` | Payment callback + ticket purchase |

## Environment variables

See [`.env.example`](.env.example) for all options.

Required for live data:

- `CINEMA_SOURCE_API_KEY`
- `CINEMA_SOURCE_HOUSE_ID`
- `RTS_USERNAME`
- `RTS_PASSWORD`

## Project structure

```
src/cinemasource/
  components/     React UI
  lib/            Cinema Source + RTS clients, listing builder
  config.ts       Environment config
  types.ts        Shared TypeScript types
  index.ts        Public exports
src/app/
  showtimes/      Demo page
  api/            Route handlers
```

## Differences from Concrete CMS version

- No global JS variables; data flows through React context
- jQuery/Bootstrap replaced with React + Tailwind CSS
- PHP sessions replaced with encrypted `iron-session` cookies
- Posters stored in `public/posters/` instead of Concrete file manager
- Config via environment variables instead of block settings

## License

MIT
