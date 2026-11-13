import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { confirmListingFee, creditFunding, paystackEnabled } from "@/lib/paystack";
import { applyTransferEvent } from "@/lib/payouts";

export async function POST(req: Request) {
  if (!paystackEnabled()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const raw = await req.text(); // the signature is over the exact raw body
  const sig = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(raw).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const ref = event.data?.reference;
  try {
    if (event.event === "charge.success" && ref?.startsWith("lf_")) await confirmListingFee(ref);
    else if (event.event === "charge.success" && ref) await creditFunding(ref);
    else if (event.event?.startsWith("transfer.") && ref) await applyTransferEvent(event.event, ref);
  } catch { return NextResponse.json({ error: "retry" }, { status: 500 }); } // non-2xx makes Paystack retry
  return NextResponse.json({ ok: true });
}
