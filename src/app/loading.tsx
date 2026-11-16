// Shown while any page loads (the header stays visible). Grey shapes hint at the content to come.
export default function Loading() {
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-12" aria-busy="true" aria-label="Loading page">
      <div className="grid gap-3">
        <div className="skeleton h-9 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
      <div className="skeleton h-28 rounded-xl" />
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line">
            <div className="skeleton h-40 rounded-none" />
            <div className="grid gap-2 p-4">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton mt-2 h-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
