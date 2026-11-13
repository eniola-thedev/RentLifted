import { createAdminClient } from "@/lib/supabase/admin";

// Applies Paystack's transfer result to the payout. Only moves forward from the expected state, so repeats are harmless.
export async function applyTransferEvent(event: string, reference: string) {
  const admin = createAdminClient();
  if (event === "transfer.success") {
    await admin.from("payouts").update({ status: "paid", paid_at: new Date().toISOString(), failure_reason: null }).eq("reference", reference).eq("status", "processing");
  } else if (event === "transfer.failed") {
    await admin.from("payouts").update({ status: "failed", failure_reason: "The transfer failed." }).eq("reference", reference).eq("status", "processing");
  } else if (event === "transfer.reversed") {
    await admin.from("payouts").update({ status: "failed", failure_reason: "The transfer was reversed." }).eq("reference", reference).in("status", ["processing", "paid"]);
  }
}
