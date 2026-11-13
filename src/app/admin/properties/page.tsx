import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { requireProfile } from "@/lib/auth";
import { naira, photoUrl, STATUS_LABEL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Row = { id: string; title: string; purpose: string; status: string; area: string | null; city: string; annual_rent: number | null; sale_price: number | null; property_images: { path: string; position: number }[] };
const TABS = [["", "All"], ["published", "Live"], ["draft", "Drafts"], ["rented", "Rented"], ["sold", "Sold"], ["archived", "Archived"]] as const;

// Listings posted by RENTLIFTED admins (not landlords' listings, which are reviewed at /admin/listings).
export default async function AdminProperties({ searchParams }: { searchParams: Promise<{ status?: string; notice?: string }> }) {
  const { status: raw, notice } = await searchParams;
  const status = TABS.some(([v]) => v && v === raw) ? raw! : "";
  await requireProfile("admin");
  const supabase = await createClient();
  let q = supabase.from("properties").select("id, title, purpose, status, area, city, annual_rent, sale_price, property_images(path, position), profiles!properties_owner_id_fkey!inner(role)").eq("profiles.role", "admin");
  if (status) q = q.eq("status", status);
  const { data } = await q.order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-maroon">Our listings</h1>
        <Link href="/admin/properties/new" className="btn btn-p">Post a property</Link>
      </div>
      {notice && <p role="status" className="mt-4 rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}
      <nav aria-label="Filter by status" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([v, l]) => (
          <Link key={l} href={v ? `/admin/properties?status=${v}` : "/admin/properties"} aria-current={status === v ? "page" : undefined}
            className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-bold ${status === v ? "border-maroon bg-maroon text-white" : "border-line text-mut hover:border-maroon"}`}>{l}</Link>
        ))}
      </nav>
      <ul className="mt-4 grid gap-3">
        {rows.map((r) => {
          const cover = [...r.property_images].sort((a, b) => a.position - b.position)[0];
          const [label, cls] = STATUS_LABEL[r.status] ?? [r.status, ""];
          return (
            <li key={r.id}>
              <Link href={`/admin/properties/${r.id}`} className="flex items-center gap-4 rounded-xl border border-line bg-white p-3 hover:border-maroon">
                <div className="h-20 w-28 flex-none overflow-hidden rounded-lg bg-cream">{cover && <img src={photoUrl(cover.path)} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{r.title}</b>
                  <span className="text-sm text-mut">{[r.area, r.city].filter(Boolean).join(", ")} · {r.purpose === "rent" ? `${naira(r.annual_rent ?? 0)}/year` : naira(r.sale_price ?? 0)}</span>
                </div>
                <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span>
              </Link>
            </li>
          );
        })}
        {!rows.length && <li className="rounded-xl bg-cream p-8 text-center text-sm text-mut">{status ? "No listings with this status." : "No listings posted by RENTLIFTED yet."}</li>}
      </ul>
    </main>
  );
}
