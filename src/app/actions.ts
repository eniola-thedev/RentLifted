"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/smile";

function back(path: string, key: "error" | "notice", msg: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(msg)}`);
}
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
// Where the link in the confirmation email lands (see src/app/auth/confirm/route.ts).
const confirmUrl = () => `${siteUrl()}/auth/confirm`;

export async function signUp(fd: FormData) {
  const role = fd.get("role") === "landlord" ? "landlord" : "tenant"; // admin can never be chosen here
  const email = text(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) back("/signup", "error", "Password must be at least 8 characters.");
  if (password !== String(fd.get("confirm_password") ?? "")) {
    redirect(`/signup?role=${role}&error=${encodeURIComponent("Passwords do not match. Enter the same password in both fields.")}`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { full_name: text(fd, "full_name"), phone: text(fd, "phone"), role }, emailRedirectTo: confirmUrl() },
  });
  if (error) back("/signup", "error", error.message);
  if (!data.session) redirect(`/verify?email=${encodeURIComponent(email)}`);
  redirect("/dashboard");
}

export async function signIn(fd: FormData) {
  const supabase = await createClient();
  const email = text(fd, "email");
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(fd.get("password") ?? "") });
  if (error?.code === "email_not_confirmed") redirect(`/verify?email=${encodeURIComponent(email)}`);
  if (error) back("/login", "error", "Wrong email or password.");
  const next = text(fd, "next");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendLink(fd: FormData) {
  const email = text(fd, "email");
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmUrl() } });
  const q = error ? `error=${encodeURIComponent("Please wait a minute before asking for another link.")}` : `notice=${encodeURIComponent("A new link is on its way. Check your inbox and spam folder.")}`;
  redirect(`/verify?email=${encodeURIComponent(email)}&${q}`);
}
