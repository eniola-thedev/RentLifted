import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import LandlordForm, { type OfflineLandlord } from "@/components/LandlordForm";
import { requireProfile } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function OfflineLandlordPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const [{ id }, { error, notice }] = await Promise.all([params, searchParams, requireProfile("admin")]);
  const supabase = await createClient();
  const { data } = await supabase.from("offline_landlords").select("*, assisted_listings(property_id, properties(id, title, status))").eq("id", id).maybeSingle();
  if (!data) notFound();
  const d = data as OfflineLandlord & { assisted_listings: { property_id: string; properties: { id: string; title: string; status: string } | null }[] };
  // Private documents: short-lived links, admins only.
  const signed = d.id_files.length ? (await supabase.storage.from("kyc-documents").createSignedUrls(d.id_files, 600)).data ?? [] : [];

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <AdminNav />
      <Link href="/admin/landlords" className="text-sm font-bold text-maroon">← Landlords</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">{d.full_name}</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}

      <section className="mt-6 rounded-xl border border-line p-5" aria-labelledby="ls">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ls" className="font-extrabold">Their listings</h2>
          <Link href={`/admin/properties/new?landlord=${d.id}`} className="btn btn-p !py-2">List a property for them</Link>
        </div>
        <ul className="mt-3 grid gap-2 text-sm">
          {d.assisted_listings.map(({ properties: p }) => p && (
            <li key={p.id}><Link href={`/admin/properties/${p.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 hover:border-maroon"><b>{p.title}</b><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${(STATUS_LABEL[p.status] ?? ["", ""])[1]}`}>{(STATUS_LABEL[p.status] ?? [p.status])[0]}</span></Link></li>
          ))}
          {!d.assisted_listings.length && <li className="text-mut">No listings yet.</li>}
        </ul>
      </section>

      {signed.length > 0 && (
        <section className="mt-6" aria-labelledby="idf">
          <h2 id="idf" className="font-extrabold">ID on file</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {signed.map((s, i) => s.signedUrl && <li key={s.path}><a href={s.signedUrl} target="_blank" rel="noreferrer" className="btn btn-o !py-1.5 text-xs">ID document {i + 1}</a></li>)}
          </ul>
        </section>
      )}

      <div className="mt-8"><LandlordForm d={d} /></div>
    </main>
  );
}
