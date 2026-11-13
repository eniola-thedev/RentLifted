"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const text = (fd: FormData, k: string, max = 4000) => String(fd.get(k) ?? "").trim().slice(0, max);
function back(path: string, key: "error" | "sent", msg: string): never { redirect(`${path}?${key}=${encodeURIComponent(msg)}#form`); }

// Contact and Complaints forms. Both land in the admin inbox at /admin/messages.
export async function sendMessage(fd: FormData) {
  const kind = text(fd, "kind") === "complaint" ? "complaint" : "contact";
  const path = kind === "complaint" ? "/complaints" : "/contact";
  if (text(fd, "website")) back(path, "sent", "1"); // honeypot: bots fill hidden fields; pretend it worked
  const full_name = text(fd, "full_name", 120), email = text(fd, "email", 200), message = text(fd, "message");
  if (full_name.length < 2) back(path, "error", "Enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back(path, "error", "Enter a valid email address so we can reply.");
  if (message.length < 10) back(path, "error", "Tell us a little more: at least 10 characters.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("support_messages").insert({
    kind, full_name, email, message, topic: text(fd, "topic", 60) || null,
    phone: text(fd, "phone", 30) || null, reference: text(fd, "reference", 120) || null, user_id: user?.id ?? null,
  });
  if (error) back(path, "error", "Your message didn’t send. Please try again, or call us on 09160462975.");
  back(path, "sent", "1");
}

export async function setMessageStatus(fd: FormData) {
  await requireProfile("admin");
  const status = text(fd, "status");
  if (!["new", "in_progress", "resolved"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("support_messages").update({ status }).eq("id", text(fd, "id"));
  revalidatePath("/admin/messages");
}
