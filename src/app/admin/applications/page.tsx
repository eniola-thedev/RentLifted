import AdminNav from "@/components/AdminNav";
import { requireProfile } from "@/lib/auth";
import { AFFORD_LABEL, fmtDate, naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { decideApplication } from "./actions";

type Row = { id: string; monthly_rent: number; salary_min: number; rent_to_income: number; affordability: string; message: string | null; created_at: string; properties: { title: string; area: string | null; city: string } | null; profiles: { full_name: string | null; phone: string | null } | null };

export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("applications").select("id, monthly_rent, salary_min, rent_to_income, affordability, message, created_at, properties(title, area, city), profiles(full_name, phone)").eq("status", "pending").order("created_at");
  const rows = (data ?? []) as unknown as Row[];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <AdminNav />
      <h1 className="text-3xl font-extrabold text-maroon">Applications</h1>
      <p className="mt-1 text-sm text-mut">{rows.length} waiting. Approving creates 12 monthly installments, due every 30 days from the start date, and marks the property as rented.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 grid gap-5">
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl border border-line p-5">
            <h2 className="font-extrabold">{r.profiles?.full_name} <span className="font-medium text-mut">· {r.profiles?.phone} · applied {fmtDate(r.created_at)}</span></h2>
            <p className="mt-1 text-sm">{r.properties?.title}, {[r.properties?.area, r.properties?.city].filter(Boolean).join(", ")}</p>
            <p className="mt-2 text-sm text-mut">Monthly rent {naira(r.monthly_rent)} · income {naira(r.salary_min)}/month · {r.rent_to_income}% of income · <b className="text-maroon">{AFFORD_LABEL[r.affordability]}</b></p>
            {r.message && <p className="mt-2 text-sm text-mut">“{r.message}”</p>}
            <form action={decideApplication} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={r.id} />
              <label className="grid gap-1 text-xs font-semibold">Start date<input type="date" name="start_date" defaultValue={today} className="field" /></label>
              <label className="grid gap-1 text-xs font-semibold">Note (optional)<input name="note" className="field w-56" /></label>
              <button name="decision" value="approve" className="btn btn-p">Approve</button>
              <button name="decision" value="decline" className="btn btn-o">Decline</button>
            </form>
          </article>
        ))}
        {!rows.length && <p className="rounded-xl bg-cream p-6 text-sm text-mut">Nothing to review.</p>}
      </div>
    </main>
  );
}
