"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function decideApplication(fd: FormData) {
  const id = String(fd.get("id")), note = String(fd.get("note") ?? "").trim(), supabase = await createClient();
  const fail = (m: string): never => redirect(`/admin/applications?error=${encodeURIComponent(m)}`);
  if (fd.get("decision") === "approve") {
    const start = String(fd.get("start_date") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) fail("Choose a start date.");
    const { error } = await supabase.rpc("approve_application", { aid: id, start_on: start, note });
    if (error) fail("Could not approve. The property may no longer be available.");
  } else {
    const { error } = await supabase.rpc("decline_application", { aid: id, note });
    if (error) fail("Could not decline this application.");
  }
  revalidatePath("/admin/applications");
  redirect("/admin/applications");
}
