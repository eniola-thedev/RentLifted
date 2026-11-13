import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { applyForProperty } from "@/app/applications/actions";
import { createClient } from "@/lib/supabase/server";
import { AFFORD_LABEL, naira } from "@/lib/format";
import { getProperty } from "@/lib/properties";

type Aff = { available: boolean; monthly_rent?: number; salary_min?: number; ratio?: number | null; max_pct?: number; comfortable_pct?: number; max_monthly?: number; level?: string };

export default async function Apply({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const p = await getProperty(id);
  if (!p || !p.monthly_rent_available) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/properties/${id}/apply`)}`);
  const { data: profile } = await supabase.from("profiles").select("role, kyc_level").eq("id", user.id).single();
  const { data } = await supabase.rpc("check_affordability", { pid: id });
  const a = (data ?? { available: false }) as Aff;
  const back = <Link href={`/properties/${id}`} className="text-sm font-bold text-maroon">← Back to property</Link>;
  const shell = (c: React.ReactNode) => <main className="mx-auto max-w-xl px-5 py-12">{back}<h1 className="mt-4 text-3xl font-extrabold text-maroon">Apply for monthly rent</h1><p className="mt-1 text-mut">{p.title} · {[p.area, p.city].filter(Boolean).join(", ")}</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-6 grid gap-4">{c}</div></main>;

  if (profile?.role !== "tenant") return shell(<p className="rounded-xl bg-cream p-4 text-sm text-mut">Only tenant accounts can apply for monthly rent.</p>);
  if ((profile.kyc_level ?? 0) < 3) return shell(<div className="rounded-xl bg-cream p-4 text-sm"><p className="text-mut">Monthly rent needs verification Level 3: your identity, work and income.</p><Link href="/profile" className="btn btn-p mt-3">Continue verification</Link></div>);
  if (!a.available) return shell(<p className="rounded-xl bg-cream p-4 text-sm text-mut">This property is no longer available for monthly rent.</p>);

  const ok = a.level !== "not_eligible";
  return shell(<>
    <section className="rounded-xl border border-line p-5" aria-labelledby="aff">
      <h2 id="aff" className="font-extrabold">Affordability check</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-mut">Monthly rent</dt><dd className="font-bold">{naira(a.monthly_rent ?? 0)}</dd></div>
        <div><dt className="text-mut">Your monthly income</dt><dd className="font-bold">{naira(a.salary_min ?? 0)}</dd></div>
        <div><dt className="text-mut">Rent as share of income</dt><dd className="font-bold">{a.ratio != null ? `${a.ratio}%` : "n/a"}</dd></div>
        <div><dt className="text-mut">Result</dt><dd className={`font-bold ${ok ? "text-maroon" : "text-red-800"}`}>{AFFORD_LABEL[a.level ?? "not_eligible"]}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-mut">Monthly rent should be no more than {a.max_pct}% of your income ({a.comfortable_pct}% or less is comfortable). Based on your income, the most we can offer you is {naira(a.max_monthly ?? 0)} a month.</p>
    </section>
    {ok ? (
      <form action={applyForProperty} className="grid gap-4">
        <input type="hidden" name="id" value={id} />
        <label className="grid gap-1 text-sm font-semibold">Message to the team (optional)<textarea name="message" rows={4} maxLength={1000} className="field" /></label>
        <button className="btn btn-p">Submit application</button>
        <p className="text-xs text-mut">If approved, RENTLIFTED pays the landlord upfront and you repay monthly. You’ll see the landlord’s contact details once approved.</p>
      </form>
    ) : <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">This property’s monthly rent is above what your income supports, so you can’t apply for it. Look for a property with a monthly rent of {naira(a.max_monthly ?? 0)} or less.</p>}
  </>);
}
