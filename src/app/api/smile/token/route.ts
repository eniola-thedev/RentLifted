import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteUrl, smileBase, smileEnabled, smileEnv } from "@/lib/smile";

// Mints a short-lived Smile ID token for the signed-in user. The API key never reaches the browser.
export async function POST() {
  if (!smileEnabled()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = new FormData();
  form.set("user_id", user.id); // bound server-side, so the webhook can trust who the result belongs to
  form.set("product", "biometric_kyc");
  const res = await fetch(`${smileBase()}/v3/token`, {
    method: "POST",
    headers: { "smileid-partner-id": process.env.SMILE_ID_PARTNER_ID!, "smileid-api-key": process.env.SMILE_ID_API_KEY! },
    body: form,
  });
  if (!res.ok) return NextResponse.json({ error: "token_failed" }, { status: 502 });
  const { token } = (await res.json()) as { token: string };
  return NextResponse.json({
    token,
    config: {
      environment: smileEnv(),
      callback_url: `${siteUrl()}/api/smile/webhook`,
      partner_details: { partner_id: process.env.SMILE_ID_PARTNER_ID, name: "RENTLIFTED", logo_url: `${siteUrl()}/logo.png`, policy_url: `${siteUrl()}/privacy`, theme_color: "#7a0f1f" },
    },
  });
}
