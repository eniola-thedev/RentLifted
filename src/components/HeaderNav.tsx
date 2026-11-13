"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const NAV = [["Home", "/"], ["Rent", "/properties?type=rent"], ["Buy Property", "/properties?type=sale"], ["Buy Land", "/land"], ["Property Management", "/property-management"], ["About Us", "/about"], ["Contact Us", "/contact"]];
import { ACCOUNT_ROUTES, inRoutes } from "@/lib/routes";

export type HeaderUser = { home: string; initials: string; badge: "verified" | "unverified" | null };

function ProfileLink({ u }: { u: HeaderUser }) {
  const verified = u.badge === "verified";
  return (
    <Link href="/profile" className="flex flex-none items-center gap-2.5 rounded-full p-1 hover:bg-cream sm:pr-3"
      aria-label={`Your profile${u.badge ? `, ${verified ? "verified" : "not verified yet"}` : ""}`}>
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-maroon text-sm font-bold text-white" aria-hidden="true">
        {u.initials || <Icon name="user" className="h-5 w-5" />}
      </span>
      {u.badge && (
        <span aria-hidden="true" className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${verified ? "bg-maroon/10 text-maroon" : "bg-copper/20 text-[#7a4a1e]"}`}>
          <Icon name={verified ? "check" : "alert"} className="h-3.5 w-3.5" />{verified ? "Verified" : "Unverified"}
        </span>
      )}
    </Link>
  );
}

export default function HeaderNav({ user }: { user: HeaderUser | null }) {
  const path = usePathname();
  const inAccount = !!user && inRoutes(path, ACCOUNT_ROUTES); // site menu hidden here; public pages always show it

  if (inAccount) return <div className="ml-auto"><ProfileLink u={user!} /></div>;

  return (<>
    <nav className="ml-auto hidden gap-5 text-[13.5px] font-semibold lg:flex" aria-label="Main">
      {NAV.map(([t, h]) => <Link key={t} href={h} className="border-b-2 border-transparent py-1 hover:border-copper">{t}</Link>)}
    </nav>
    <div className="ml-auto flex items-center gap-2 lg:ml-0">
      {user ? (<>
        <Link href={user.home} className="btn btn-p shrink-0 whitespace-nowrap !px-4 !py-2.5 sm:!px-5 sm:!py-3">Dashboard</Link>
        <ProfileLink u={user} />
      </>) : (<>
        <Link href="/login" className="btn btn-o hidden sm:inline-flex">Sign in</Link>
        <Link href="/signup" className="btn btn-p shrink-0 whitespace-nowrap !px-4 !py-2.5 sm:!px-5 sm:!py-3">Get Started</Link>
      </>)}
      <details className="relative lg:hidden">
        <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg border border-line text-xl sm:h-11 sm:w-11" aria-label="Menu">☰</summary>
        <nav className="absolute right-0 top-12 grid w-56 gap-3 rounded-xl border border-line bg-white p-4 text-sm font-semibold shadow-xl" aria-label="Mobile">
          {NAV.map(([t, h]) => <Link key={t} href={h}>{t}</Link>)}
          {!user && <Link href="/login" className="sm:hidden">Sign in</Link>}
        </nav>
      </details>
    </div>
  </>);
}
