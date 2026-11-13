import Link from "next/link";
import HeaderNav, { type HeaderUser } from "@/components/HeaderNav";
import { createClient } from "@/lib/supabase/server";
import { homeFor, isVerified } from "@/lib/types";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("full_name, role, kyc_level").eq("id", user.id).single() : { data: null };
  const u: HeaderUser | null = profile ? {
    home: homeFor(profile.role),
    initials: (profile.full_name ?? "").trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join(""),
    badge: profile.role === "admin" ? null : isVerified(profile.kyc_level ?? 0) ? "verified" : "unverified",
  } : null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-5">
        <Link href="/" aria-label="RENTLIFTED home" className="flex-none"><img src="/logo.svg" alt="RENTLIFTED" className="h-9 w-auto sm:h-11" /></Link>
        <HeaderNav user={u} />
      </div>
    </header>
  );
}
