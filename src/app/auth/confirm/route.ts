import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeFor } from "@/lib/types";

// The link in the "Confirm signup" email opens here. It works with both link styles Supabase can send:
// - token_hash (recommended email template; works even if the link is opened on another device or browser)
// - code (Supabase's default {{ .ConfirmationURL }}; must be opened in the browser that signed up)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash"), type = url.searchParams.get("type") as EmailOtpType | null, code = url.searchParams.get("code");
  const supabase = await createClient();
  const ok = tokenHash && type ? !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error
    : code ? !(await supabase.auth.exchangeCodeForSession(code)).error : false;
  let home = "/dashboard";
  if (ok) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null };
    if (p) home = homeFor(p.role);
  }
  const dest = new URL(ok ? home : "/login", url.origin);
  if (ok) dest.searchParams.set("notice", "Email confirmed. Welcome to RENTLIFTED.");
  else dest.searchParams.set("error", "That link has expired or was already used. Sign in, and we’ll send you a new one if you still need it.");
  return NextResponse.redirect(dest);
}
