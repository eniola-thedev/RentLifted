import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { creditFunding } from "@/lib/paystack";
import { fmtDate, naira } from "@/lib/format";
import { startFunding } from "./actions";

export default async function Wallet({ searchParams }: { searchParams: Promise<{ error?: string; reference?: string }> }) {
  const { error, reference } = await searchParams;
  await requireProfile("tenant");
  let credited = false;
  if (reference) { try { credited = await creditFunding(reference); } catch { credited = false; } } // covers a slow webhook
  const supabase = await createClient();
  const [{ data: bal }, { data: next }, { data: entries }, { data: cards }, { data: grace }] = await Promise.all([
    supabase.rpc("my_wallet_balance"),
    supabase.from("installments").select("number, due_date, amount, status").in("status", ["scheduled", "overdue"]).order("due_date").limit(1),
    supabase.from("wallet_entries").select("id, amount, kind, created_at").order("created_at", { ascending: false }).limit(15),
    supabase.from("saved_cards").select("id, last4, brand, exp_month, exp_year").order("created_at", { ascending: false }),
    supabase.rpc("rent_grace_days"),
  ]);
  const balance = Number(bal ?? 0), n = next?.[0];
  const days = n ? Math.ceil((new Date(n.due_date).getTime() - Date.now()) / 86400000) : null;
  const short = n ? Math.max(0, n.amount - balance) : 0;
  const graceDays = Number(grace ?? 5);
  const graceEnd = n ? (() => { const d = new Date(n.due_date); d.setUTCDate(d.getUTCDate() + graceDays); return d.toISOString().slice(0, 10); })() : null;
  const inGrace = !!n && n.status !== "overdue" && days != null && days <= 0;
  const KIND: Record<string, string> = { funding: "Wallet funded", rent_payment: "Monthly rent paid", refund: "Refund", adjustment: "Adjustment" };
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link href="/tenant" className="text-sm font-bold text-maroon">← Dashboard</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">My wallet</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {credited && <p role="status" className="mt-4 rounded-lg bg-cream p-3 text-sm text-maroon">Payment received. Your wallet has been updated.</p>}
      <section className="mt-6 rounded-2xl bg-gradient-to-br from-deep to-maroon p-6 text-white">
        <p className="text-sm text-[#f1d8d3]">Balance</p><p className="text-4xl font-extrabold">{naira(balance)}</p>
        {n && <p className="mt-3 text-sm text-[#f1d8d3]">Next rent: {naira(n.amount)} {n.status === "overdue" ? "(overdue)" : inGrace ? `was due ${fmtDate(n.due_date)}, grace until ${fmtDate(graceEnd!)}` : `due ${fmtDate(n.due_date)}`}</p>}
      </section>
      {n && (
        <p className={`mt-4 rounded-lg p-3 text-sm ${short ? "bg-cream text-mut" : "bg-cream text-maroon"}`}>
          {short && inGrace ? <>Add {naira(short)} by {fmtDate(graceEnd!)}. After that your rent is overdue and we charge your saved card.</>
            : short ? <>Add {naira(short)} before the due date{days != null && days > 0 ? <>, about {naira(Math.ceil(short / days))} a day</> : ""}. We take your rent from this wallet on the due date.</> : "Your wallet covers your next rent. We’ll take it on the due date."}
        </p>
      )}
      <section className="mt-6" aria-labelledby="fund">
        <h2 id="fund" className="text-lg font-extrabold">Add money</h2>
        <p className="text-sm text-mut">Save any amount, any time. Your monthly rent is taken from this wallet on the due date.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[5000, 10000, 25000, 50000].map((v) => <form key={v} action={startFunding}><input type="hidden" name="amount" value={v} /><button className="btn btn-o !py-2">{naira(v)}</button></form>)}
        </div>
        <form action={startFunding} className="mt-3 flex gap-2">
          <input name="amount" inputMode="numeric" required placeholder="Other amount (₦)" aria-label="Amount in naira" className="field max-w-[12rem]" />
          <button className="btn btn-p">Add money</button>
        </form>
      </section>
      <section className="mt-6" aria-labelledby="card">
        <h2 id="card" className="text-lg font-extrabold">Card for monthly rent</h2>
        {cards?.length ? (
          <>
            <ul className="mt-2 grid gap-2">{cards.map((c) => <li key={c.id} className="rounded-lg border border-line bg-white p-3 text-sm"><b className="capitalize">{c.brand ?? "Card"}</b> ending {c.last4}<span className="text-xs text-mut"> · expires {c.exp_month}/{c.exp_year}</span></li>)}</ul>
            <p className="mt-2 text-xs text-mut">If your wallet can’t cover your rent on the due date, we charge the difference to this card.</p>
          </>
        ) : (
          <form action={startFunding} className="mt-2 grid gap-3 rounded-xl bg-cream p-4">
            <p className="text-sm text-mut">Add money by card once and we keep the card on file. It’s needed for monthly rent. The money goes into your wallet.</p>
            <input type="hidden" name="card_only" value="1" />
            <div className="flex gap-2"><input name="amount" inputMode="numeric" defaultValue="1000" required aria-label="Amount in naira" className="field max-w-[10rem]" /><button className="btn btn-p">Add card</button></div>
            <label className="flex items-start gap-2 text-xs text-mut"><input type="checkbox" name="consent" className="mt-0.5" />I allow RENTLIFTED to charge this card for any monthly rent my wallet can’t cover.</label>
          </form>
        )}
      </section>
      <section className="mt-8" aria-labelledby="hist">
        <h2 id="hist" className="text-lg font-extrabold">Recent activity</h2>
        <ul className="mt-3 grid gap-2">
          {(entries ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-3 text-sm">
              <span>{KIND[e.kind] ?? e.kind}<span className="block text-xs text-mut">{fmtDate(e.created_at)}</span></span>
              <b className={e.amount > 0 ? "text-maroon" : ""}>{e.amount > 0 ? "+" : "−"}{naira(Math.abs(e.amount))}</b>
            </li>
          ))}
          {!entries?.length && <li className="rounded-lg bg-cream p-4 text-sm text-mut">No activity yet.</li>}
        </ul>
      </section>
    </main>
  );
}
