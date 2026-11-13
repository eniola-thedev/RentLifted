import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-3xl font-extrabold text-maroon">Page not found</h1>
      <p className="mt-2 text-mut">The page or property you’re looking for isn’t available.</p>
      <Link href="/properties" className="btn btn-p mt-6">Browse properties</Link>
    </main>
  );
}
