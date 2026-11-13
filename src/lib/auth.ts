import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function requireProfile(role?: Role) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("id, role, full_name, phone, kyc_level").eq("id", user.id).single();
  const profile = data as Profile | null;
  if (!profile) redirect("/login");
  if (role && profile.role !== role) redirect("/dashboard");
  return { user, profile };
}
