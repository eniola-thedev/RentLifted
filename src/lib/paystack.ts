import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const API = "https://api.paystack.co";
export const paystackEnabled = () => !!(process.env.PAYSTACK_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const auth = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` });
const json = { "Content-Type": "application/json" };

type Tx = {
  status: string; currency: string; amount: number; reference: string; channel?: string;
  metadata?: { user_id?: string; purpose?: string } | null;
  authorization?: { authorization_code?: string; reusable?: boolean; signature?: string; last4?: string; card_type?: string; exp_month?: string; exp_year?: string; bank?: string } | null;
};

export async function initFunding(email: string, naira: number, userId: string, callbackUrl: string, cardOnly = false) {
  const reference = `wf_${crypto.randomUUID()}`;
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST", headers: { ...auth(), ...json },
    body: JSON.stringify({ email, amount: Math.round(naira * 100), currency: "NGN", reference, callback_url: callbackUrl, ...(cardOnly ? { channels: ["card"] } : {}), metadata: { user_id: userId, purpose: "wallet_funding" } }),
  });
  const body = await res.json();
  return res.ok && body?.data?.authorization_url ? (body.data.authorization_url as string) : null;
}

// Confirms a payment with Paystack, credits the wallet, and keeps a reusable card. Safe to call many times for one reference.
export async function creditFunding(reference: string): Promise<boolean> {
  if (!paystackEnabled() || !/^wf_[0-9a-f-]{36}$/i.test(reference)) return false;
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, { headers: auth(), cache: "no-store" });
  const d = (await res.json())?.data as Tx | undefined;
  const uid = d?.metadata?.user_id ?? "";
  if (!res.ok || !d || d.status !== "success" || d.currency !== "NGN" || d.metadata?.purpose !== "wallet_funding" || !UUID.test(uid)) return false;
  const admin = createAdminClient();
  const { error } = await admin.from("wallet_entries").upsert({ user_id: uid, amount: d.amount / 100, kind: "funding", reference: d.reference }, { onConflict: "reference", ignoreDuplicates: true });
  if (error) throw new Error("wallet credit failed");
  const au = d.authorization;
  if (d.channel === "card" && au?.reusable && au.authorization_code && au.signature) {
    try { // a card problem must never undo the credit above
      await admin.from("saved_cards").upsert({ user_id: uid, authorization_code: au.authorization_code, signature: au.signature, last4: au.last4, brand: au.card_type?.trim(), exp_month: au.exp_month, exp_year: au.exp_year, bank: au.bank }, { onConflict: "user_id,signature", ignoreDuplicates: true });
      await admin.from("kyc_submissions").upsert({ user_id: uid, kind: "card", status: "approved", reviewed_at: new Date().toISOString(), provider: "paystack", provider_ref: au.signature, data: { last4: au.last4 ?? null, brand: au.card_type?.trim() ?? null }, files: [] }, { onConflict: "provider,provider_ref", ignoreDuplicates: true });
    } catch { /* ignored */ }
  }
  return true;
}

// Listing fee: one Paystack checkout per property. Returns the checkout URL.
export async function initListingFee(p: { email: string; propertyId: string; userId: string; naira: number; callbackUrl: string }) {
  const reference = `lf_${crypto.randomUUID()}`;
  const admin = createAdminClient();
  const { error } = await admin.from("listing_fees").upsert(
    { property_id: p.propertyId, owner_id: p.userId, amount: p.naira, reference, status: "pending" }, { onConflict: "property_id" });
  if (error) return null;
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST", headers: { ...auth(), ...json },
    body: JSON.stringify({ email: p.email, amount: Math.round(p.naira * 100), currency: "NGN", reference, callback_url: p.callbackUrl, metadata: { user_id: p.userId, property_id: p.propertyId, purpose: "listing_fee" } }),
  });
  const body = await res.json();
  return res.ok && body?.data?.authorization_url ? (body.data.authorization_url as string) : null;
}

// Confirms a listing fee with Paystack and marks it paid. Safe to call many times for one reference.
export async function confirmListingFee(reference: string): Promise<boolean> {
  if (!paystackEnabled() || !/^lf_[0-9a-f-]{36}$/i.test(reference)) return false;
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, { headers: auth(), cache: "no-store" });
  const d = (await res.json())?.data as (Tx & { metadata?: { property_id?: string } }) | undefined;
  if (!res.ok || !d || d.status !== "success" || d.currency !== "NGN" || d.metadata?.purpose !== "listing_fee") return false;
  const admin = createAdminClient();
  const { data: fee } = await admin.from("listing_fees").select("amount, status").eq("reference", d.reference).maybeSingle();
  if (!fee || d.amount < Math.round(Number(fee.amount) * 100)) return false;
  if (fee.status === "paid") return true;
  const { error } = await admin.from("listing_fees").update({ status: "paid", paid_at: new Date().toISOString() }).eq("reference", d.reference);
  if (error) throw new Error("listing fee update failed");
  return true;
}

export async function chargeSavedCard(p: { authorizationCode: string; email: string; naira: number; reference: string; userId: string }) {
  const res = await fetch(`${API}/transaction/charge_authorization`, {
    method: "POST", headers: { ...auth(), ...json },
    body: JSON.stringify({ authorization_code: p.authorizationCode, email: p.email, amount: Math.round(p.naira * 100), currency: "NGN", reference: p.reference, metadata: { user_id: p.userId, purpose: "wallet_funding" } }),
  });
  const body = await res.json();
  return res.ok && body?.status === true && body?.data?.status === "success";
}

export async function listBanks(): Promise<{ name: string; code: string }[]> {
  if (!process.env.PAYSTACK_SECRET_KEY) return [];
  const res = await fetch(`${API}/bank?country=nigeria&perPage=200`, { headers: auth(), next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const list = ((await res.json()).data ?? []) as { name: string; code: string; currency?: string }[];
  const seen = new Set<string>();
  return list.filter((b) => (!b.currency || b.currency === "NGN") && !seen.has(b.code) && seen.add(b.code)).map((b) => ({ name: b.name, code: b.code })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveAccount(accountNumber: string, bankCode: string): Promise<string | null> {
  const res = await fetch(`${API}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`, { headers: auth(), cache: "no-store" });
  return res.ok ? ((await res.json())?.data?.account_name ?? null) : null;
}

export async function createRecipient(p: { name: string; accountNumber: string; bankCode: string }): Promise<string | null> {
  const res = await fetch(`${API}/transferrecipient`, { method: "POST", headers: { ...auth(), ...json }, body: JSON.stringify({ type: "nuban", name: p.name, account_number: p.accountNumber, bank_code: p.bankCode, currency: "NGN" }) });
  return res.ok ? ((await res.json())?.data?.recipient_code ?? null) : null;
}

export async function initiateTransfer(p: { naira: number; recipient: string; reference: string; reason: string }): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${API}/transfer`, { method: "POST", headers: { ...auth(), ...json }, body: JSON.stringify({ source: "balance", amount: Math.round(p.naira * 100), recipient: p.recipient, reference: p.reference, reason: p.reason }) });
  const body = await res.json();
  if (!res.ok || !body?.status) return { ok: false, message: body?.message ?? "Transfer was not accepted." };
  return { ok: true, message: body?.data?.status === "otp" ? "Paystack is waiting for OTP approval." : undefined };
}
