import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { AFFORD_LABEL, APP_STATUS, fmtDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Row = { id: string; property_title: string; status: string; affordability: string; message: string | null; created_at: string; tenant_name: string | null; tenant_phone: string | null };

export default async function LandlordApplications() {
  await requireProfile("landlord");
  const supabase = await createClient();
  const { data } = await supabase.from("landlord_applications").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/landlord" className="text-sm font-bold text-maroon">← Dashboard</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">Applications</h1>
      <p className="mt-1 text-sm text-mut">Tenants who applied for monthly rent on your properties. RENTLIFTED reviews each application. Contact details are shared once an application is approved.</p>
      <ul className="mt-6 grid gap-3">
        {rows.map((r) => {
          const [label, cls] = APP_STATUS[r.status] ?? [r.status, ""];
          return (
            <li key={r.id} className="rounded-xl border border-line p-4 text-sm">
              <div className="flex items-start justify-between gap-3"><div><b>{r.tenant_name}</b><span className="block text-xs text-mut">{r.property_title} · applied {fmtDate(r.created_at)} · affordability: {AFFORD_LABEL[r.affordability] ?? r.affordability}</span></div><span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span></div>
              {r.message && <p className="mt-2 text-mut">“{r.message}”</p>}
              {r.status === "approved" && r.tenant_phone && <p className="mt-3 rounded-lg bg-cream p-3">Tenant contact: <a href={`tel:${r.tenant_phone}`} className="font-bold text-maroon">{r.tenant_phone}</a></p>}
            </li>
          );
        })}
        {!rows.length && <li className="rounded-xl bg-cream p-8 text-center text-sm text-mut">No applications yet.</li>}
      </ul>
    </main>
  );
}
