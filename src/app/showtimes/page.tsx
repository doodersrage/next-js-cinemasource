import { CinemaShowtimes } from '@/cinemasource';
import { buildCinemaListing } from '@/cinemasource/lib/listingBuilder';
import { getCinemaConfig } from '@/cinemasource/config';

export default async function ShowtimesPage() {
  let data;
  let error: string | null = null;

  try {
    data = await buildCinemaListing(getCinemaConfig());
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unable to load showtimes.';
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl font-bold text-[#ca0012]">Showtimes</h1>
          <p className="mt-2 text-zinc-600">
            Cinema Source listings with RTS online ticketing.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded border border-red-200 bg-red-50 p-6 text-red-700">
            <h2 className="font-semibold">Configuration required</h2>
            <p className="mt-2">{error}</p>
            <p className="mt-4 text-sm">
              Copy <code>.env.example</code> to <code>.env.local</code> and add your Cinema Source and RTS credentials.
            </p>
          </div>
        </div>
      ) : (
        data && <CinemaShowtimes data={data} />
      )}
    </main>
  );
}
