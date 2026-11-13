"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MSG: Record<string, string> = {
  verification: "Complete verification Level 3 (work and income) before applying.",
  not_eligible: "This rent is above what your income supports.",
  already_applied: "You already have an open application for this property.",
  unavailable: "This property is no longer available for monthly rent.",
  sign_in: "Please sign in to apply.",
};

export async function applyForProperty(fd: FormData) {
  const id = String(fd.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_for_property", { pid: id, msg: String(fd.get("message") ?? "") });
  if (error) redirect(`/properties/${id}/apply?error=${encodeURIComponent(MSG[error.message] ?? "We couldn’t submit your application. Please try again.")}`);
  revalidatePath("/tenant");
  redirect("/tenant?notice=" + encodeURIComponent("Application submitted. We’ll review it and update you here."));
}

export async function withdrawApplication(fd: FormData) {
  const supabase = await createClient();
  await supabase.rpc("withdraw_application", { aid: String(fd.get("id")) });
  revalidatePath("/tenant");
  redirect("/tenant?notice=" + encodeURIComponent("Application withdrawn."));
}
