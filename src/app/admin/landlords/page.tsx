import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import Icon from "@/components/Icon";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Row = { id: string; full_name: string; phone: string; id_files: string[]; account_name: string | null; assisted_listings: { property_id: string }[] };

// Landlords met in person, who don't have an account. Admins list properties for them.
export default async function OfflineLandlords({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  await requireProfile("admin");
  const supabase = await createClient();
  let query = supabase.from("offline_landlords").select("id, full_name, phone, id_files, account_name, assisted_listings(property_id)");
  const term = q.replace(/[^\p{L}\p{N}\s+-]/gu, "").trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-maroon">Landlords we list for</h1>
          <p className="mt-1 text-sm text-mut">Landlords met in person who don’t use the app. No listing fee.</p>
        </div>
        <Link href="/admin/landlords/new" className="btn btn-p">Add a landlord</Link>
      </div>
      <form className="mt-5 flex gap-2" role="search">
        <label className="sr-only" htmlFor="q">Search by name or phone</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name or phone" className="field" />
        <button className="btn btn-o !py-2">Search</button>
      </form>
      <ul className="mt-4 grid gap-3">
        {rows.map((r) => {
          const missing = [!r.id_files.length && "ID", !r.account_name && "bank account"].filter(Boolean);
          return (
            <li key={r.id}>
              <Link href={`/admin/landlords/${r.id}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4 hover:border-maroon">
                <div className="min-w-0 flex-1"><b className="block">{r.full_name}</b><span className="text-sm text-mut tabular-nums">{r.phone} · {r.assisted_listings.length} listing{r.assisted_listings.length === 1 ? "" : "s"}</span></div>
                {missing.length
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-copper/20 px-2.5 py-1 text-xs font-bold text-[#7a4a1e]"><Icon name="alert" className="h-3.5 w-3.5" />Missing {missing.join(" and ")}</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-maroon/10 px-2.5 py-1 text-xs font-bold text-maroon"><Icon name="check" className="h-3.5 w-3.5" />Details complete</span>}
              </Link>
            </li>
          );
        })}
        {!rows.length && <li className="rounded-xl bg-cream p-8 text-center text-sm text-mut">{term ? "No landlord matches that search." : "No landlords yet. Add one after a visit."}</li>}
      </ul>
    </main>
  );
}
