import Link from "next/link";
import { signOut } from "@/app/actions";
import Icon from "@/components/Icon";
import KycCard from "@/components/KycCard";
import { homeFor, isVerified } from "@/lib/types";
import { requireProfile } from "@/lib/auth";
import { loadKyc } from "@/lib/kycState";

const ROLE: Record<string, string> = { tenant: "Tenant", landlord: "Landlord", admin: "Admin" };

export default async function Profile({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { user, profile } = await requireProfile();
  const kycRole = profile.role === "landlord" ? "landlord" : profile.role === "tenant" ? "tenant" : null;
  const steps = kycRole ? await loadKyc(kycRole, user) : [];
  const verified = isVerified(profile.kyc_level);

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-12">
      <Link href={homeFor(profile.role)} className="text-sm font-bold text-maroon">← Dashboard</Link>
      {notice && <p role="status" className="rounded-lg bg-cream p-3 text-sm text-maroon">{notice}</p>}

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-6" aria-labelledby="me">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-maroon text-white" aria-hidden="true"><Icon name="user" className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <h1 id="me" className="text-2xl font-extrabold text-maroon">{profile.full_name || "Your profile"}</h1>
          <p className="break-words text-sm text-mut">{user.email}{profile.phone ? ` · ${profile.phone}` : ""}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full border border-line px-2.5 py-1 text-mut">{ROLE[profile.role]}</span>
            {kycRole && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${verified ? "bg-maroon/10 text-maroon" : "bg-copper/20 text-[#7a4a1e]"}`}>
                <Icon name={verified ? "check" : "alert"} className="h-3.5 w-3.5" />{verified ? "Verified" : `Unverified · Level ${profile.kyc_level} of 3`}
              </span>
            )}
          </p>
        </div>
      </section>

      {kycRole && <KycCard role={kycRole} level={profile.kyc_level} steps={steps} />}

      <form action={signOut}>
        <button className="btn btn-o w-full sm:w-auto"><Icon name="logout" className="h-4 w-4" />Sign out</button>
      </form>
    </main>
  );
}
