import Link from "next/link";
import Icon from "@/components/Icon";

export const metadata = { title: "Land – coming soon | RENTLIFTED" };

// Buying and selling land isn't available yet. Every land link in the site points here.
export default function LandComingSoon() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream text-maroon"><Icon name="grid" className="h-7 w-7" /></span>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-copper">Coming soon</p>
      <h1 className="mt-2 text-balance text-3xl font-extrabold text-maroon">Buying and selling land is on its way</h1>
      <p className="mt-3 text-pretty text-mut">
        We’re building land sales the careful way: verified titles, checked sellers and safe payments, so you can buy or sell with confidence.
        Until then, you can rent a home monthly or list a property for rent.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/properties?type=rent" className="btn btn-p">Browse homes for rent</Link>
        <Link href="/signup?role=landlord" className="btn btn-o">List a property for rent</Link>
      </div>
      <p className="mt-6 text-sm text-mut">Want to be first to know? <Link href="/contact" className="font-bold text-maroon underline">Contact us</Link> and we’ll tell you when it’s live.</p>
    </main>
  );
}
