"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { initFunding, paystackEnabled } from "@/lib/paystack";
import { siteUrl } from "@/lib/smile";

function back(m: string): never {
  redirect(`/tenant/wallet?error=${encodeURIComponent(m)}`);
}

export async function startFunding(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const amount = Number(String(fd.get("amount") ?? "").replace(/[,\s₦]/g, ""));
  if (!Number.isFinite(amount) || amount < 100 || amount > 5_000_000) back("Enter an amount between ₦100 and ₦5,000,000.");
  const cardOnly = fd.get("card_only") === "1";
  if (cardOnly && fd.get("consent") !== "on") back("Please tick the box to allow us to use your card for rent.");
  if (!paystackEnabled()) back("Wallet funding isn’t available yet.");
  const url = await initFunding(user.email, amount, user.id, `${siteUrl()}/tenant/wallet`, cardOnly);
  if (!url) back("We couldn’t start the payment. Please try again.");
  redirect(url);
}
