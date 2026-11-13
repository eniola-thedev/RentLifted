import AdminNav from "@/components/AdminNav";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { naira, photoUrl, videoUrl } from "@/lib/format";
import { reviewListing } from "./actions";

type Row = { id: string; title: string; description: string | null; purpose: string; property_type: string; bedrooms: number | null; bathrooms: number | null; land_size_sqm: number | null; state: string; city: string; area: string | null; address: string | null; annual_rent: number | null; sale_price: number | null; monthly_rent_available: boolean; property_images: { path: string; position: number }[]; property_videos: { path: string; position: number }[] | null; listing_fees: { status: string } | { status: string }[] | null; profiles: { full_name: string | null; phone: string | null; kyc_level: number } | null };

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("admin");
  const supabase = await createClient();
  // The owner hint keeps the profiles join unambiguous now that listing_fees also links properties and profiles.
  const { data } = await supabase.from("properties").select("*, property_images(path, position), property_videos(path, position), listing_fees(status), profiles!properties_owner_id_fkey(full_name, phone, kyc_level)").eq("status", "pending_review").order("created_at");
  const rows = (data ?? []) as unknown as Row[];
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <AdminNav />
      <h1 className="text-3xl font-extrabold text-maroon">Listing review</h1>
      <p className="mt-1 text-sm text-mut">{rows.length} waiting for review.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 grid gap-5">
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl border border-line p-5">
            <h2 className="font-extrabold">{r.title} <span className="font-medium text-mut">· {r.purpose} · {r.property_type}</span></h2>
            <p className="text-sm text-mut">By {r.profiles?.full_name} · {r.profiles?.phone} · KYC level {r.profiles?.kyc_level}</p>
            <p className="mt-2 text-sm">{[r.address, r.area, r.city, r.state].filter(Boolean).join(", ")} · {r.purpose === "rent" ? `${naira(r.annual_rent ?? 0)}/year` : naira(r.sale_price ?? 0)}{r.bedrooms != null && ` · ${r.bedrooms} bed, ${r.bathrooms ?? 0} bath`}{r.land_size_sqm != null && ` · ${r.land_size_sqm} sqm`}</p>
            {r.description && <p className="mt-2 text-sm text-mut">{r.description}</p>}
            <ul className="mt-3 flex flex-wrap gap-2">{[...r.property_images].sort((a, b) => a.position - b.position).map((i) => <li key={i.path}><a href={photoUrl(i.path)} target="_blank" rel="noreferrer"><img src={photoUrl(i.path)} alt="" className="h-16 w-24 rounded-md object-cover" /></a></li>)}{!r.property_images.length && <li className="text-xs text-red-800">No photos yet</li>}</ul>
            {!!r.property_videos?.length && <ul className="mt-2 grid gap-2 sm:grid-cols-2">{[...r.property_videos].sort((a, b) => a.position - b.position).map((v, i) => <li key={v.path}><video src={videoUrl(v.path)} controls preload="metadata" className="aspect-video w-full rounded-md bg-ink" aria-label={`Video ${i + 1}`} /></li>)}</ul>}
            {(() => {
              const fee = Array.isArray(r.listing_fees) ? r.listing_fees[0] : r.listing_fees;
              const n = r.property_images.length, v = r.property_videos?.length ?? 0;
              return <p className="mt-2 text-xs text-mut">{n} photo{n === 1 ? "" : "s"} · {v} video{v === 1 ? "" : "s"} · Listing fee: <b className={fee?.status === "paid" ? "text-maroon" : "text-red-800"}>{fee?.status === "paid" ? "paid" : "not paid"}</b></p>;
            })()}
            <form action={reviewListing} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={r.id} />
              {r.monthly_rent_available && <label className="grid gap-1 text-xs font-semibold">Monthly rent (₦)<input name="monthly_rent" inputMode="numeric" className="field w-40" /></label>}
              <label className="grid gap-1 text-xs font-semibold">Note to landlord (if sending back)<input name="note" className="field w-64" /></label>
              <button name="decision" value="approve" className="btn btn-p">Approve and publish</button>
              <button name="decision" value="reject" className="btn btn-o">Send back</button>
            </form>
          </article>
        ))}
        {!rows.length && <p className="rounded-xl bg-cream p-6 text-sm text-mut">Nothing to review.</p>}
      </div>
    </main>
  );
}
