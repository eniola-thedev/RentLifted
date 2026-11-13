import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { smileEnabled } from "@/lib/smile";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Payload = {
  status?: string; message?: string; completed_at?: string;
  partner_params?: { job_id?: string; user_id?: string } | null;
  id_fields?: { full_name?: string | null; first_name?: string | null; last_name?: string | null; id_number?: string | null } | null;
  antifraud?: { summary?: { fraud_detected?: boolean }; fraud_risk?: { risk_level?: string } } | null;
};

// Smile ID signs each webhook: base64(HMAC-SHA256(api key, timestamp + partner id + "sid_request")).
function signatureValid(req: Request) {
  const sig = req.headers.get("response-signature"), ts = req.headers.get("response-timestamp");
  if (!sig || !ts) return false;
  const expected = createHmac("sha256", process.env.SMILE_ID_API_KEY!).update(ts + process.env.SMILE_ID_PARTNER_ID! + "sid_request").digest("base64");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!smileEnabled()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!signatureValid(req)) return NextResponse.json({ error: "bad_signature" }, { status: 401 });

  let p: Payload;
  try { p = await req.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const userId = p.partner_params?.user_id ?? "";
  if (!UUID.test(userId)) return NextResponse.json({ ok: true }); // not one of ours; acknowledge so it isn't retried

  // clear = verified. attention (or any fraud flag) = a person reviews it. block/error = try again.
  const fraud = !!p.antifraud?.summary?.fraud_detected;
  const status = p.status === "clear" ? (fraud ? "pending" : "approved") : p.status === "attention" ? "pending" : "rejected";
  const note = status !== "rejected" ? null : p.status === "block" ? "We couldn’t verify your identity with those details. Please try again." : "The check couldn’t be completed. Please try again.";
  const idNumber = p.id_fields?.id_number ?? "";
  const name = p.id_fields?.full_name || [p.id_fields?.first_name, p.id_fields?.last_name].filter(Boolean).join(" ") || null;

  const { error } = await createAdminClient().from("kyc_submissions").upsert({
    user_id: userId, kind: "identity", status, reviewer_note: note, files: [],
    reviewed_at: status === "pending" ? null : new Date().toISOString(),
    provider: "smile_id", provider_ref: p.partner_params?.job_id ?? `${userId}:${p.completed_at ?? Date.now()}`,
    // Only the last 4 digits of the ID number are kept.
    data: { provider: "smile_id", smile_status: p.status, smile_message: p.message, name_on_id: name, id_last4: idNumber ? idNumber.slice(-4) : null, fraud_risk: p.antifraud?.fraud_risk?.risk_level ?? null, fraud_detected: fraud },
  }, { onConflict: "provider,provider_ref", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 }); // non-2xx makes Smile ID retry
  return NextResponse.json({ ok: true });
}
