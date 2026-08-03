# next-js-cinemasource

Next.js module for **Cinema Source (Webedia)** showtime data and **RTS POS** online ticketing. Ported from the Concrete CMS blocks in [`concrete57-rts-cinemasource-blocks`](https://github.com/doodersrage/concrete-cms-rts-cinemasource-blocks).

## Features

- Cinema Source theater schedule + movie detail fetching (HTTPS, API v4.0 by default)
- RTS POS integration (`ShowTimeXml`, `CheckSoldOut`, `CreatePayment`, `Buy`)
- React components for listings, galleries, coming-soon views, and ticket checkout
- API route handlers replacing the legacy `/rts/*.php` proxy scripts
- Poster caching to `public/posters/` (configurable)

## Install

```bash
npm install next-js-cinemasource
```

Peer dependencies: **Next.js 14+**, **React 18+**.

## Usage in a Next.js app

### 1. Environment variables

Copy the variables from [`.env.example`](.env.example) into your app's `.env.local`:

- `CINEMA_SOURCE_API_KEY`
- `CINEMA_SOURCE_HOUSE_ID`
- `RTS_USERNAME`
- `RTS_PASSWORD`
- `SESSION_SECRET` (32+ characters)

### 2. Styles

Import the bundled Tailwind styles in your root layout:

```tsx
import 'next-js-cinemasource/styles.css';
```

If you already use Tailwind CSS v4, you can scan the package source instead:

```css
@import "tailwindcss";
@source "../../node_modules/next-js-cinemasource/dist";
```

### 3. API routes

Add thin route files that re-export the package handlers:

```ts
// app/api/cinema/listing/route.ts
export { GET } from 'next-js-cinemasource/routes/cinema-listing';
export const revalidate = 7200;

// app/api/rts/proxy/route.ts
export { POST } from 'next-js-cinemasource/routes/rts-proxy';

// app/api/rts/session/route.ts
export { POST } from 'next-js-cinemasource/routes/rts-session';

// app/api/rts/redirect/route.ts
export { GET } from 'next-js-cinemasource/routes/rts-redirect';

// app/api/rts/complete/route.ts
export { POST } from 'next-js-cinemasource/routes/rts-complete';
```

Ensure `NEXT_PUBLIC_SITE_URL`, `SITE_PROCESS_COMPLETE_URL`, and `SITE_RETURN_URL` point at these routes in your deployment.

### 4. Components

```tsx
import { CinemaShowtimes } from 'next-js-cinemasource';
import { buildCinemaListing, getCinemaConfig } from 'next-js-cinemasource/server';
import 'next-js-cinemasource/styles.css';

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

Import from `next-js-cinemasource/server`.

## Local development (this repo)

This repository doubles as the package source and a demo Next.js app.

```bash
cp .env.example .env.local
# fill in Cinema Source + RTS credentials

npm install
npm run dev
```

Open [http://localhost:3000/showtimes](http://localhost:3000/showtimes).

Build the publishable package:

```bash
npm run build:package
```

## Package exports

| Subpath | Purpose |
|---------|---------|
| `next-js-cinemasource` | React components and shared types |
| `next-js-cinemasource/server` | Server utilities (`buildCinemaListing`, `getCinemaConfig`) |
| `next-js-cinemasource/routes/*` | Next.js App Router route handlers |
| `next-js-cinemasource/styles.css` | Pre-built Tailwind component styles |

## Project structure

```
src/cinemasource/
  components/     React UI
  lib/            Cinema Source + RTS clients, listing builder
  routes/         App Router route handlers (published subpaths)
  config.ts       Environment config
  types.ts        Shared TypeScript types
  index.ts        Public exports
  styles.css      Tailwind entry (built to dist/styles.css)
src/app/
  showtimes/      Demo page
  api/            Re-exports route handlers for the demo app
```

## Differences from Concrete CMS version

- No global JS variables; data flows through React context
- jQuery/Bootstrap replaced with React + Tailwind CSS
- PHP sessions replaced with encrypted `iron-session` cookies
- Posters stored in `public/posters/` instead of Concrete file manager
- Config via environment variables instead of block settings

## License

MIT
