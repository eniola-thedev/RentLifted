import AdminNav from "@/components/AdminNav";
import { requireProfile } from "@/lib/auth";
import { fmtDate, naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { payLandlord } from "./actions";

type Row = { id: string; landlord_id: string | null; offline_landlords: { full_name: string; bank_name: string | null; bank_code: string | null; account_number: string | null; account_name: string | null; id_files: string[] } | null; amount: number; status: string; failure_reason: string | null; created_at: string; paid_at: string | null; profiles: { full_name: string | null; kyc_level: number } | null; tenancies: { properties: { title: string } | null } | null };
type Bank = { user_id: string; data: { bank_name?: string; bank_code?: string; account_number?: string; account_name?: string } };

export default async function AdminPayouts({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("payouts").select("id, landlord_id, amount, status, failure_reason, created_at, paid_at, profiles(full_name, kyc_level), offline_landlords(full_name, bank_name, bank_code, account_number, account_name, id_files), tenancies(properties(title))").order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as unknown as Row[];
  const { data: banks } = await supabase.from("kyc_submissions").select("user_id, data").eq("kind", "bank_account").eq("status", "approved").in("user_id", rows.map((r) => r.landlord_id).filter(Boolean)).order("created_at");
  const bankOf = new Map<string, Bank["data"]>();
  ((banks ?? []) as Bank[]).forEach((b) => bankOf.set(b.user_id, b.data)); // later rows win, so the newest is kept
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <AdminNav />
      <h1 className="text-3xl font-extrabold text-maroon">Landlord payouts</h1>
      <p className="mt-1 text-sm text-mut">The upfront annual rent for each approved tenancy. Paystack must have enough balance, and each transfer is started here by an admin.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <ul className="mt-6 grid gap-3">
        {rows.map((r) => {
          const ol = r.offline_landlords; // landlord listed in person, without an account
          const b = ol ? (ol.account_number ? ol : undefined) : bankOf.get(r.landlord_id ?? "");
          const name = ol ? `${ol.full_name} (listed in person)` : r.profiles?.full_name;
          const blocker = ol ? (!ol.id_files.length ? "Landlord’s ID isn’t on file." : !ol.bank_code || !ol.account_name ? "Landlord’s bank account isn’t confirmed." : null)
            : r.profiles && r.profiles.kyc_level < 3 ? "Landlord hasn’t completed verification Level 3." : !b?.bank_code ? "No approved bank account with a bank code." : null;
          return (
            <li key={r.id} className="rounded-xl border border-line p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><b>{naira(r.amount)}</b> to {name}<span className="block text-xs text-mut">{r.tenancies?.properties?.title} · {b ? `${b.bank_name} · ${b.account_number} · ${b.account_name}` : "no bank account yet"}</span></div>
                <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold capitalize text-maroon">{r.status}</span>
              </div>
              {r.failure_reason && <p className="mt-2 text-xs text-red-800">{r.failure_reason}</p>}
              {r.status === "paid" && r.paid_at && <p className="mt-2 text-xs text-mut">Paid {fmtDate(r.paid_at)}</p>}
              {(r.status === "pending" || r.status === "failed") && (blocker ? <p className="mt-2 text-xs text-mut">{blocker}</p> : <form action={payLandlord} className="mt-3"><input type="hidden" name="id" value={r.id} /><button className="btn btn-p !py-2">{r.status === "failed" ? "Retry payment" : "Pay landlord"}</button></form>)}
            </li>
          );
        })}
        {!rows.length && <li className="rounded-xl bg-cream p-6 text-sm text-mut">No payouts yet. One is created when an application is approved.</li>}
      </ul>
    </main>
  );
}
