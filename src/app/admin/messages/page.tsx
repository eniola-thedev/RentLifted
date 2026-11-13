import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { setMessageStatus } from "@/app/support/actions";
import { requireProfile } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Msg = { id: string; kind: string; topic: string | null; full_name: string; email: string; phone: string | null; reference: string | null; message: string; status: string; created_at: string };
const TABS = [["new", "New"], ["in_progress", "In progress"], ["resolved", "Resolved"]] as const;
const KIND = { contact: ["Message", "bg-cream text-maroon"], complaint: ["Complaint", "bg-red-100 text-red-800"] } as Record<string, [string, string]>;

// Inbox for the Contact and Complaints forms.
export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = TABS.some(([v]) => v === raw) ? raw! : "new";
  await requireProfile("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("support_messages").select("*").eq("status", status).order("created_at", { ascending: status === "new" }).limit(100);
  const rows = (data ?? []) as Msg[];
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <AdminNav />
      <h1 className="text-3xl font-extrabold text-maroon">Messages and complaints</h1>
      <nav aria-label="Filter by status" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([v, l]) => (
          <Link key={v} href={`/admin/messages?status=${v}`} aria-current={status === v ? "page" : undefined}
            className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-bold ${status === v ? "border-maroon bg-maroon text-white" : "border-line text-mut hover:border-maroon"}`}>{l}</Link>
        ))}
      </nav>
      <ul className="mt-4 grid gap-3">
        {rows.map((m) => {
          const [label, cls] = KIND[m.kind] ?? [m.kind, ""];
          return (
            <li key={m.id} className="rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>{label}</span><b>{m.topic ?? "No topic"}</b></p>
                  <p className="mt-1 text-sm text-mut">{m.full_name} · <a href={`mailto:${m.email}`} className="font-bold text-maroon underline">{m.email}</a>{m.phone && <> · <a href={`tel:${m.phone}`} className="tabular-nums underline">{m.phone}</a></>}</p>
                </div>
                <span className="text-xs text-mut">{fmtDate(m.created_at)}</span>
              </div>
              {m.reference && <p className="mt-2 text-xs text-mut">About: {m.reference}</p>}
              <p className="mt-3 whitespace-pre-line text-pretty text-sm leading-relaxed">{m.message}</p>
              <form action={setMessageStatus} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={m.id} />
                {TABS.filter(([v]) => v !== status).map(([v, l]) => <button key={v} name="status" value={v} className="btn btn-o !px-3 !py-1.5 text-xs">Mark {l.toLowerCase()}</button>)}
              </form>
            </li>
          );
        })}
        {!rows.length && <li className="rounded-xl bg-cream p-8 text-center text-sm text-mut">Nothing here.</li>}
      </ul>
    </main>
  );
}
