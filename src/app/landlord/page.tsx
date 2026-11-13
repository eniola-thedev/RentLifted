import Link from "next/link";
import Icon from "@/components/Icon";
import { requireProfile } from "@/lib/auth";
import { fmtDate, naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const PAYOUT_LABEL: Record<string, string> = { pending: "Being arranged", processing: "On its way", paid: "Paid", failed: "Delayed" };

export default async function LandlordHome({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { user, profile } = await requireProfile("landlord");
  const supabase = await createClient();
  const [{ data }, { count: pendingApps }, { data: payouts }] = await Promise.all([
    supabase.from("properties").select("status").eq("owner_id", user.id),
    supabase.from("landlord_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payouts").select("id, amount, status, paid_at, created_at").order("created_at", { ascending: false }),
  ]);
  const count = (s: string) => (data ?? []).filter((r) => r.status === s).length;
  const all = payouts ?? [];
  const sum = (pred: (s: string) => boolean) => all.filter((p) => pred(p.status)).reduce((t, p) => t + Number(p.amount), 0);
  const received = sum((s) => s === "paid"), upcoming = sum((s) => s !== "paid");
  const level = profile.kyc_level;

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-12">
      <div>
        <h1 className="text-3xl font-extrabold text-maroon">Hello, {profile.full_name || "there"}</h1>
        <p className="mt-1 text-mut">List your properties and get a year’s rent upfront.</p>
      </div>
      {notice && <p role="status" className="rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}

      {level < 3 && (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-copper/50 bg-cream p-5" aria-labelledby="verify">
          <Icon name="shield" className="h-8 w-8 flex-none text-maroon" />
          <div className="min-w-0 flex-1">
            <h2 id="verify" className="font-extrabold text-maroon">{level < 2 ? "Verify your account to publish listings" : "Finish verification to get paid"}</h2>
            <p className="mt-0.5 text-sm text-mut">
              {level < 2 ? "You can save drafts now. To send a listing for review, confirm your identity with your BVN or NIN and a selfie."
                : "Your listings can go live. Add proof of ownership and your bank account so we can pay your upfront rent."}
            </p>
          </div>
          <Link href="/kyc" className="btn btn-p !px-4 !py-2">Verify now</Link>
        </section>
      )}

      <section className="rounded-xl border border-line p-6" aria-labelledby="earn">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="earn" className="text-lg font-extrabold text-maroon">Upfront rent</h2>
          <Link href="/landlord/applications" className="btn btn-o !py-2">Applications{pendingApps ? ` (${pendingApps} new)` : ""}</Link>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div><dt className="text-xs text-mut">Received</dt><dd className="text-2xl font-extrabold tabular-nums">{naira(received)}</dd></div>
          <div><dt className="text-xs text-mut">On the way</dt><dd className="text-2xl font-extrabold tabular-nums text-mut">{naira(upcoming)}</dd></div>
        </dl>
        {all.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {all.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-line p-3 text-sm">
                <span><b className="tabular-nums">{naira(p.amount)}</b><span className="block text-xs text-mut">{p.status === "paid" && p.paid_at ? `Paid ${fmtDate(p.paid_at)}` : `Approved ${fmtDate(p.created_at)}`}</span></span>
                <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-maroon">{PAYOUT_LABEL[p.status] ?? p.status}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-mut">When we approve a tenant for one of your homes, the year’s rent is paid to you here.</p>}
      </section>

      <section className="rounded-xl border border-line p-6" aria-labelledby="props">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="props" className="text-lg font-extrabold text-maroon">My properties</h2>
          <div className="flex gap-2"><Link href="/landlord/properties" className="btn btn-o !py-2">View all</Link><Link href="/landlord/properties/new" className="btn btn-p !py-2">Add a property</Link></div>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {([["Live", "published"], ["In review", "pending_review"], ["Drafts", "draft"], ["Rented", "rented"]] as const).map(([l, s]) => (
            <li key={s}>
              <Link href={`/landlord/properties?status=${s}`} className="block rounded-lg bg-cream p-3 hover:ring-2 hover:ring-maroon/30">
                <span className="block text-2xl font-extrabold tabular-nums text-maroon">{count(s)}</span><span className="text-xs text-mut">{l}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
