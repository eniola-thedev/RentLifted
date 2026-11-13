import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { naira } from "@/lib/format";
import { getProperty, typeLabel } from "@/lib/properties";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();
  const place = [p.address, p.area, p.city, p.state].filter(Boolean).join(", ");
  const facts: [string, string][] = [
    ["Type", typeLabel(p.property_type)], ...(p.bedrooms != null ? [["Bedrooms", String(p.bedrooms)] as [string, string]] : []),
    ...(p.bathrooms != null ? [["Bathrooms", String(p.bathrooms)] as [string, string]] : []),
    ...(p.land_size_sqm != null ? [["Land size", `${p.land_size_sqm} sqm`] as [string, string]] : []),
  ];
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <Link href={`/properties?type=${p.purpose === "rent" ? "rent" : p.property_type === "land" ? "land" : "sale"}`} className="text-sm font-bold text-maroon">← Back to results</Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="grid gap-2 sm:grid-cols-3">
            {p.images.length ? p.images.slice(0, 3).map((src, i) => (
              <img key={src} src={src} alt={i === 0 ? p.title : `${p.title}, photo ${i + 1}`} className={`w-full rounded-xl object-cover ${i === 0 ? "h-72 sm:col-span-3 sm:h-96" : "h-32 sm:h-40"}`} />
            )) : <div className="h-72 rounded-xl bg-cream sm:col-span-3" />}
          </div>
          {p.images.length > 3 && (
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {p.images.slice(3).map((src, i) => <li key={src}><img src={src} alt={`${p.title}, photo ${i + 4}`} loading="lazy" className="h-32 w-full rounded-xl object-cover sm:h-40" /></li>)}
            </ul>
          )}
          {!!p.videos?.length && (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="Videos">
              {p.videos.map((src, i) => <li key={src}><video src={src} controls preload="metadata" className="aspect-video w-full rounded-xl bg-ink" aria-label={`${p.title}, video ${i + 1}`} /></li>)}
            </ul>
          )}
          <h1 className="mt-6 text-3xl font-extrabold text-maroon">{p.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-mut"><Icon name="pin" className="h-4 w-4 text-maroon" />{place}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(([k, v]) => <div key={k} className="rounded-lg bg-cream p-3"><dt className="text-xs text-mut">{k}</dt><dd className="font-bold capitalize">{v}</dd></div>)}
          </dl>
          {p.description && <><h2 className="mb-2 mt-7 text-lg font-extrabold">About this property</h2><p className="text-mut">{p.description}</p></>}
        </div>
        <aside className="h-fit rounded-2xl border border-line bg-white p-6 shadow-sm">
          {p.purpose === "rent" ? (<>
            <p className="text-sm text-mut">Annual rent</p><p className="text-3xl font-extrabold text-maroon">{naira(p.annual_rent ?? 0)}</p>
            {p.monthly_rent_available && p.monthly_rent != null && <p className="mt-2 rounded-lg bg-cream p-3 text-sm font-bold text-[#9a5a2c]">Monthly option: from {naira(p.monthly_rent)}/month</p>}
            {p.monthly_rent_available ? <>
              <Link href={`/properties/${p.id}/apply`} className="btn btn-p mt-5 w-full">Apply for monthly rent</Link>
              <p className="mt-3 text-xs text-mut">Monthly rent is subject to an eligibility assessment. You’ll need a verified tenant account.</p>
            </> : <Link href="/signup?role=tenant" className="btn btn-p mt-5 w-full">Make an enquiry</Link>}
          </>) : (<>
            <p className="text-sm text-mut">Price</p><p className="text-3xl font-extrabold text-maroon">{naira(p.sale_price ?? 0)}</p>
            <Link href="/signup" className="btn btn-p mt-5 w-full">Make an enquiry</Link>
          </>)}
        </aside>
      </div>
    </main>
  );
}
