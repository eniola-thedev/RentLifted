import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { buildSteps, type Role, type Submission } from "@/lib/kyc";

export async function loadKyc(role: Role, user: User) {
  const supabase = await createClient();
  const { data } = await supabase.from("kyc_submissions").select("id, kind, status, reviewer_note").eq("user_id", user.id).order("created_at", { ascending: false });
  return buildSteps(role, (data ?? []) as Submission[], !!user.email_confirmed_at, !!user.phone_confirmed_at);
}
