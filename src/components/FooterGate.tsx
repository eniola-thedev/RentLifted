"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_ROUTES, AUTH_ROUTES, inRoutes } from "@/lib/routes";

// Full footer on public pages; a slim legal line in the account area and on sign-in screens.
export default function FooterGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (!inRoutes(path, [...ACCOUNT_ROUTES, ...AUTH_ROUTES])) return <>{children}</>;
  return (
    <footer className="border-t border-line px-5 py-5 text-center text-xs text-mut">
      © {new Date().getFullYear()} RENTLIFTED · <Link href="/privacy" className="underline hover:text-maroon">Privacy</Link> · <Link href="/contact" className="underline hover:text-maroon">Contact us</Link>
    </footer>
  );
}
