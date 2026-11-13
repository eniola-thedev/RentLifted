"use client";
import Link from "next/link";

// Shown instead of a blank page when something fails while loading a page.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-maroon">This page didn’t load</h1>
      <p className="mt-2 text-sm text-mut">Please try again. If it keeps happening, go back to your dashboard.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="btn btn-p">Try again</button>
        <Link href="/dashboard" className="btn btn-o">Go to dashboard</Link>
      </div>
    </main>
  );
}
