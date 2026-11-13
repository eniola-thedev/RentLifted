import Link from "next/link";
import { COMPANY } from "@/lib/company";

const cols: [string, [string, string][]][] = [
  ["Explore", [["Rent a Property", "/properties?type=rent"], ["Buy a Property", "/properties?type=sale"], ["Buy Land", "/land"], ["Sell Land", "/land"]]],
  ["Our Services", [["Monthly Rent", "/monthly-rent"], ["Property Management", "/property-management"], ["Land Transactions", "/land"], ["Sell Property", "/sell"]]],
  ["Company", [["About Us", "/about"], ["Careers", "/careers"], ["Partner With Us", "/partner"], ["Our Mission", "/about#mission"]]],
  ["Support", [["Contact Us", "/contact"], ["FAQs", "/faq"], ["Help Centre", "/help"], ["Complaints", "/complaints"]]],
];
const link = "underline-offset-4 hover:text-white hover:underline";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-deep to-maroon px-5 pb-5 pt-11 text-[13px] text-[#f6e4df]">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3 lg:grid-cols-[1.3fr_repeat(4,1fr)_1.5fr]">
        <div>
          <Link href="/" aria-label="RENTLIFTED home" className="inline-block rounded-lg bg-white px-3 py-2"><img src="/logo.svg" alt="RENTLIFTED" className="h-10 w-auto" /></Link>
          <p className="mt-3 max-w-[16rem] text-[#f1d8d3]">Elevating the way we live.</p>
        </div>
        {cols.map(([h, links]) => (
          <nav key={h} aria-labelledby={`f-${h}`}>
            <h2 id={`f-${h}`} className="mb-3 font-bold text-white">{h}</h2>
            <ul className="grid gap-2">{links.map(([t, href]) => <li key={t}><Link href={href} className={link}>{t}</Link></li>)}</ul>
          </nav>
        ))}
        <address className="grid content-start gap-2 not-italic">
          <h2 className="mb-1 font-bold text-white">Get in touch</h2>
          <a href={`tel:${COMPANY.phoneIntl}`} className={`${link} tabular-nums`}>{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.email}`} className={`${link} break-all`}>{COMPANY.email}</a>
          <span>{COMPANY.address}.</span>
        </address>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4 text-xs">
        <span>© {new Date().getFullYear()} RENTLIFTED. All rights reserved.</span>
        <span className="flex gap-4"><Link href="/privacy" className={link}>Privacy Policy</Link><Link href="/terms" className={link}>Terms and Conditions</Link></span>
      </div>
    </footer>
  );
}
