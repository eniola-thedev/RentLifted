import Link from "next/link";
import { withdrawApplication } from "@/app/applications/actions";
import { isVerified } from "@/lib/types";
import Icon from "@/components/Icon";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { requireProfile } from "@/lib/auth";
import { APP_STATUS, fmtDate, naira } from "@/lib/format";
import { getProperties, type Filters } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";

type App = { id: string; property_id: string; property_title: string; area: string | null; city: string; status: string; monthly_rent: number; review_note: string | null; created_at: string; address: string | null; landlord_name: string | null; landlord_phone: string | null };

export default async function TenantHome({ searchParams }: { searchParams: Promise<{ notice?: string } & Filters> }) {
  const { notice, ...sp } = await searchParams;
  const f: Filters = { q: sp.q, state: sp.state, ptype: sp.ptype, beds: sp.beds, min: sp.min, max: sp.max };
  const { profile } = await requireProfile("tenant");
  const verified = isVerified(profile.kyc_level);
  const supabase = await createClient();
  const [homes, { data: apps }, { data: bal }, { data: next }] = await Promise.all([
    getProperties({ ...f, type: "rent" }),
    supabase.from("tenant_applications").select("*").order("created_at", { ascending: false }),
    supabase.rpc("my_wallet_balance"),
    supabase.from("installments").select("due_date, amount").in("status", ["scheduled", "overdue"]).order("due_date").limit(1),
  ]);
  const list = (apps ?? []) as App[], n = next?.[0];
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-12">
      <div>
        <h1 className="text-3xl font-extrabold text-maroon">Hello, {profile.full_name || "there"}</h1>
        <p className="mt-1 text-mut">Find a home and apply for monthly rent.</p>
      </div>
      {notice && <p role="status" className="rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}

      {!verified && (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-copper/50 bg-cream p-5" aria-labelledby="verify">
          <Icon name="shield" className="h-8 w-8 flex-none text-maroon" />
          <div className="min-w-0 flex-1">
            <h2 id="verify" className="font-extrabold text-maroon">Verify your account to start applying</h2>
            <p className="mt-0.5 text-sm text-mut">You can browse every home now. To apply for monthly rent, confirm your identity, work and income. It takes about 10 minutes.</p>
          </div>
          <Link href="/kyc" className="btn btn-p !px-4 !py-2">Verify now</Link>
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-6" aria-labelledby="w">
        <div><h2 id="w" className="text-lg font-extrabold text-maroon">Wallet</h2><p className="text-2xl font-extrabold tabular-nums">{naira(Number(bal ?? 0))}</p>{n && <p className="text-xs text-mut">Next rent {naira(n.amount)} due {fmtDate(n.due_date)}</p>}</div>
        <Link href="/tenant/wallet" className="btn btn-p">Fund wallet</Link>
      </section>

      <section aria-labelledby="homes" className="grid gap-4">
        <h2 id="homes" className="text-lg font-extrabold text-maroon">Homes for rent</h2>
        <PropertyFilters action="/tenant" f={f} />
        <p className="text-sm text-mut" role="status">{homes.length} {homes.length === 1 ? "home" : "homes"} found</p>
        {homes.length ? (
          <div className="grid gap-5 sm:grid-cols-2">{homes.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        ) : <p className="rounded-xl bg-cream p-6 text-center text-sm text-mut">No homes match these filters. Try another state, a wider price range or fewer bedrooms.</p>}
      </section>

      <section className="rounded-xl border border-line p-6" aria-labelledby="a">
        <h2 id="a" className="text-lg font-extrabold text-maroon">My applications</h2>
        <ul className="mt-4 grid gap-3">
          {list.map((x) => {
            const [label, cls] = APP_STATUS[x.status] ?? [x.status, ""];
            return (
              <li key={x.id} className="rounded-lg border border-line p-4 text-sm">
                <div className="flex items-start justify-between gap-3"><div><b>{x.property_title}</b><span className="block text-xs text-mut">{[x.area, x.city].filter(Boolean).join(", ")} · {naira(x.monthly_rent)}/month · applied {fmtDate(x.created_at)}</span></div><span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span></div>
                {x.status === "approved" && <div className="mt-3 rounded-lg bg-cream p-3"><b className="block">Landlord contact</b>{x.landlord_name} · <a href={`tel:${x.landlord_phone}`} className="font-bold text-maroon">{x.landlord_phone}</a>{x.address && <span className="block text-mut">{x.address}</span>}</div>}
                {x.review_note && <p className="mt-2 text-xs text-mut">Note: {x.review_note}</p>}
                {x.status === "pending" && <form action={withdrawApplication} className="mt-2"><input type="hidden" name="id" value={x.id} /><button className="text-xs font-bold text-red-800 underline">Withdraw application</button></form>}
              </li>
            );
          })}
          {!list.length && <li className="rounded-lg bg-cream p-4 text-sm text-mut">No applications yet. <Link href="/properties?type=rent" className="font-bold text-maroon">Browse properties with monthly rent</Link>.</li>}
        </ul>
      </section>
    </main>
  );
}
