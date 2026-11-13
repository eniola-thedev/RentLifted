import { NextResponse } from "next/server";
import { emailEnabled, sendEmail } from "@/lib/email";
import { chargeSavedCard, creditFunding, paystackEnabled } from "@/lib/paystack";
import { siteUrl } from "@/lib/smile";
import { createAdminClient } from "@/lib/supabase/admin";

const naira = (n: number) => "₦" + new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n);
const date = (d: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
type Reminder = { installment_id: string; kind: string; email: string; full_name: string | null; amount: number; due_date: string; balance: number };

async function reminders(admin: ReturnType<typeof createAdminClient>) {
  if (!emailEnabled()) return 0;
  const { data } = await admin.rpc("reminder_candidates");
  let sent = 0;
  for (const r of (data ?? []) as Reminder[]) {
    const claim = await admin.from("reminders_sent").insert({ installment_id: r.installment_id, kind: r.kind });
    if (claim.error) continue; // already sent
    const short = Math.max(0, r.amount - r.balance), name = r.full_name?.split(" ")[0] ?? "there";
    const link = `${siteUrl()}/tenant/wallet`;
    const topUp = short > 0 ? `Your wallet has ${naira(r.balance)}, so please add ${naira(short)} here: ${link}` : "Your wallet already covers it, so there is nothing more to do.";
    const msg = r.kind === "due_in_3" ? [`Your monthly rent of ${naira(r.amount)} is due on ${date(r.due_date)}, in 3 days.`, topUp]
      : r.kind === "due_today" ? [`Your monthly rent of ${naira(r.amount)} is due today. You have a few days' grace if you need it.`, topUp]
      : r.kind === "grace_last_day" ? [`Today is the last day of the grace period for your monthly rent of ${naira(r.amount)}, which was due on ${date(r.due_date)}.`, `Please add ${naira(short)} to your wallet today: ${link}. From tomorrow it will be overdue and we will charge your saved card.`]
      : [`Your monthly rent of ${naira(r.amount)} was due on ${date(r.due_date)} and is still unpaid.`, `Please add ${naira(short)} to your wallet as soon as you can: ${link}`];
    const subject = r.kind === "overdue" ? "Your RENTLIFTED rent is overdue" : "Your RENTLIFTED rent is coming up";
    if (await sendEmail(r.email, subject, `Hi ${name},\n\n${msg.join("\n\n")}\n\nRENTLIFTED`)) sent++;
    else await admin.from("reminders_sent").delete().eq("installment_id", r.installment_id).eq("kind", r.kind); // try again next run
  }
  return sent;
}

// Runs daily (see vercel.json): wallet first, then the saved card for any shortfall, then reminders.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient(), out = { paid: 0, card_charges: 0, reminders: 0 };
  const settle = async () => { const { data, error } = await admin.rpc("process_rent_due"); if (error) throw new Error("rent job"); return Number(data ?? 0); };
  try {
    out.paid += await settle();
    if (paystackEnabled()) {
      const { data: short } = await admin.rpc("due_shortfalls");
      for (const r of (short ?? []) as { installment_id: string; tenant_id: string; email: string; shortfall: number }[]) {
        const { data: card } = await admin.from("saved_cards").select("authorization_code").eq("user_id", r.tenant_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!card) continue;
        const reference = `wf_${crypto.randomUUID()}`;
        if ((await admin.from("charge_attempts").insert({ installment_id: r.installment_id, reference })).error) continue;
        const ok = await chargeSavedCard({ authorizationCode: card.authorization_code, email: r.email, naira: Number(r.shortfall), reference, userId: r.tenant_id });
        await admin.from("charge_attempts").update({ outcome: ok ? "success" : "failed" }).eq("reference", reference);
        if (ok && (await creditFunding(reference))) out.card_charges++;
      }
      out.paid += await settle();
    }
    out.reminders = await reminders(admin);
  } catch { return NextResponse.json({ error: "failed" }, { status: 500 }); }
  return NextResponse.json(out);
}
