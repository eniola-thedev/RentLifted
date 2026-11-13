import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import { reviewKyc } from "./actions";

type Row = { id: string; kind: string; data: Record<string, unknown>; files: string[]; created_at: string; profiles: { full_name: string | null; role: string; phone: string | null } | null };

export default async function AdminKyc() {
  await requireProfile("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("kyc_submissions").select("id, kind, data, files, created_at, profiles(full_name, role, phone)").eq("status", "pending").order("created_at");
  const rows = (data ?? []) as unknown as Row[];
  const urls = new Map<string, string>();
  const all = rows.flatMap((r) => r.files);
  if (all.length) {
    const { data: signed } = await supabase.storage.from("kyc-documents").createSignedUrls(all, 600);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <AdminNav />
      <h1 className="text-3xl font-extrabold text-maroon">KYC review</h1>
      <p className="mt-1 text-sm text-mut">{rows.length} pending. Document links expire after 10 minutes.</p>
      <div className="mt-6 grid gap-5">
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl border border-line p-5">
            <h2 className="font-extrabold capitalize">{r.kind.replace("_", " ")} <span className="font-medium text-mut">· {r.profiles?.role} · {r.profiles?.full_name} · {r.profiles?.phone}</span></h2>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {Object.entries(r.data).map(([k, v]) => <div key={k}><dt className="inline text-mut">{k.replace(/_/g, " ")}: </dt><dd className="inline font-semibold">{String(v)}</dd></div>)}
            </dl>
            <ul className="mt-3 flex flex-wrap gap-2">{r.files.map((f, i) => urls.get(f) && <li key={f}><a href={urls.get(f)} target="_blank" rel="noreferrer" className="btn btn-o !py-1.5">File {i + 1}</a></li>)}</ul>
            <form action={reviewKyc} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input name="note" placeholder="Note to the user (optional)" className="field max-w-xs" />
              <button name="decision" value="approved" className="btn btn-p">Approve</button>
              <button name="decision" value="rejected" className="btn btn-o">Reject</button>
            </form>
          </article>
        ))}
        {!rows.length && <p className="rounded-xl bg-cream p-6 text-sm text-mut">Nothing to review.</p>}
      </div>
    </main>
  );
}
