"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createRecipient, initiateTransfer, paystackEnabled } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(m: string): never {
  redirect(`/admin/payouts?error=${encodeURIComponent(m)}`);
}

export async function payLandlord(fd: FormData) {
  await requireProfile("admin"); // money moves here, so check the role again on the server
  if (!paystackEnabled()) fail("Paystack isn’t configured.");
  const id = String(fd.get("id")), admin = createAdminClient();
  const { data: p } = await admin.from("payouts").select("id, landlord_id, offline_landlord_id, amount, status, attempt, recipient_code").eq("id", id).single();
  if (!p || !["pending", "failed"].includes(p.status)) fail("This payout can’t be started.");
  let b: { bank_code?: string | null; account_number?: string | null; account_name?: string | null } | undefined;
  if (p.offline_landlord_id) { // a landlord listed in person: ID and bank were collected and confirmed by an admin
    const { data: ol } = await admin.from("offline_landlords").select("bank_code, account_number, account_name, id_files").eq("id", p.offline_landlord_id).single();
    if (!ol?.id_files?.length) fail("Add the landlord’s ID on their details page first.");
    b = ol ?? undefined;
    if (!b?.bank_code || !b.account_number || !b.account_name) fail("Add and confirm the landlord’s bank account on their details page first.");
  } else {
    const { data: lp } = await admin.from("profiles").select("kyc_level").eq("id", p.landlord_id).single();
    if (!lp || lp.kyc_level < 3) fail("The landlord must complete verification Level 3 first.");
    const { data: bank } = await admin.from("kyc_submissions").select("data").eq("user_id", p.landlord_id).eq("kind", "bank_account").eq("status", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle();
    b = bank?.data as typeof b;
    if (!b?.bank_code || !b.account_number || !b.account_name) fail("The landlord’s approved bank account has no bank code. Ask them to submit it again.");
  }
  if (!b?.bank_code || !b.account_number || !b.account_name) fail("No bank account to pay.");

  const attempt = p.attempt + 1, reference = `po_${p.id}_${attempt}`;
  const { data: claimed } = await admin.from("payouts").update({ status: "processing", attempt, reference, failure_reason: null }).eq("id", id).in("status", ["pending", "failed"]).select("id");
  if (!claimed?.length) fail("This payout was already started.");

  const stop = async (reason: string): Promise<never> => {
    await admin.from("payouts").update({ status: "failed", failure_reason: reason }).eq("id", id);
    return fail(reason);
  };
  const recipient = p.recipient_code ?? (await createRecipient({ name: b.account_name, accountNumber: b.account_number, bankCode: b.bank_code }));
  if (!recipient) return stop("Paystack couldn’t set up the landlord’s account.");
  await admin.from("payouts").update({ recipient_code: recipient }).eq("id", id);
  const t = await initiateTransfer({ naira: Number(p.amount), recipient, reference, reason: "RENTLIFTED upfront rent" });
  if (!t.ok) return stop(t.message ?? "The transfer was not accepted.");
  revalidatePath("/admin/payouts");
  redirect("/admin/payouts");
}
