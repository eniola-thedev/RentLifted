"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewKyc(fd: FormData) {
  const decision = fd.get("decision") === "approved" ? "approved" : "rejected";
  const supabase = await createClient();
  await supabase.rpc("review_kyc", { sid: String(fd.get("id")), decision, note: String(fd.get("note") ?? "").trim() || null });
  revalidatePath("/admin/kyc");
}
