import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-xl rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-[#ca0012]">CinemaSource Next.js Module</h1>
        <p className="mt-4 text-zinc-600">
          A Next.js port of the Concrete CMS Cinema Source + RTS POS integration.
        </p>
        <Link
          href="/showtimes"
          className="mt-8 inline-block rounded bg-[#ca0012] px-6 py-3 text-white hover:bg-[#a8000f]"
        >
          View Showtimes Demo
        </Link>
      </div>
    </main>
  );
}
