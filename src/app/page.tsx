import Link from "next/link";
import Icon from "@/components/Icon";
import PropertyCard from "@/components/PropertyCard";
import SearchBox from "@/components/SearchBox";
import { getProperties } from "@/lib/properties";

const CATS = [
  { t: "Rent Monthly", d: "Explore eligible properties and pay rent monthly.", l: "Explore Monthly Rent", h: "/properties?type=rent", img: "apartment-3bed", icon: "home" },
  { t: "Buy Property", d: "Discover houses and apartments for sale.", l: "Explore Properties", h: "/properties?type=sale", img: "duplex-4bed", icon: "key" },
  { t: "Buy & Sell Land", d: "Buying and selling land is coming soon, with verified titles and safe payments.", l: "Coming soon", h: "/land", img: "land", icon: "grid" },
  { t: "Property Management", d: "Professional management for landlords and property owners.", l: "Learn More", h: "/property-management", img: "apartment-2bed", icon: "doc" },
] as const;
const STEPS = [
  { t: "Find Your Home", d: "Explore available properties and select one that suits your needs.", icon: "home" },
  { t: "Apply for Monthly Payment", d: "Submit your application for an eligibility assessment.", icon: "doc" },
  { t: "Move In and Pay Monthly", d: "If approved, we pay the landlord upfront and you repay as agreed.", icon: "key" },
] as const;
const WHY = [
  ["Accessibility", "Making property services more accessible to more people.", "key"],
  ["Convenience", "Explore multiple property services on one platform.", "pay"],
  ["Transparency", "Clear pricing, payment terms, and information.", "shield"],
  ["Partnership", "Supporting tenants, landlords, buyers and property owners.", "hand"],
] as const;
const H2 = "text-[clamp(26px,3.4vw,34px)] font-extrabold leading-tight text-maroon";

export default async function Home() {
  const featured = await getProperties({ limit: 4 });
  return (
    <main>
      <section className="bg-gradient-to-r from-cream via-cream to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 pb-24 pt-10 md:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-[clamp(38px,5.6vw,64px)] font-extrabold leading-[1.08] tracking-tight text-maroon">Find Your Place. Discover <span className="text-copper">Your Possibilities.</span></h1>
            <p className="my-5 max-w-md text-mut">Discover homes, access flexible monthly rent options, buy or sell properties, and manage your property with RENTLIFTED.</p>
            <div className="flex flex-wrap gap-3"><Link href="/properties" className="btn btn-p">Find a Property →</Link><Link href="/#how" className="btn btn-o">Explore Monthly Rent</Link></div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl md:min-h-[380px]">
            <img src="/images/hero.jpg" alt="Modern apartment building" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute right-3 top-5 grid gap-3 rounded-xl bg-white p-3 text-xs font-bold shadow-xl">
              {([["pay", "Flexible Monthly Rent"], ["shield", "Verified Properties"], ["hand", "Trusted Property Partner"]] as const).map(([i, t]) => (
                <div key={t} className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cream text-maroon"><Icon name={i} className="h-4 w-4" /></span>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-5"><SearchBox /></div>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className={H2}>Everything Property. One Platform.</h2>
        <p className="mt-1.5 text-mut">Rent, buy, sell land, and access professional property management services — all in one place.</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATS.map((c) => (
            <article key={c.t} className="relative flex flex-col rounded-xl border border-line bg-white">
              <img src={`/images/${c.img}.jpg`} alt="" loading="lazy" className="h-28 w-full rounded-t-xl object-cover" />
              <span className="absolute left-4 top-[88px] grid h-10 w-10 place-items-center rounded-xl bg-maroon text-white shadow-md"><Icon name={c.icon} /></span>
              <div className="flex flex-1 flex-col gap-1.5 p-4 pt-8">
                <h3 className="font-extrabold">{c.t}</h3><p className="flex-1 text-[13px] text-mut">{c.d}</p>
                <Link href={c.h} className="text-[13.5px] font-bold text-maroon">{c.l} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="bg-gradient-to-br from-deep to-maroon py-12 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-9 px-5 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-[clamp(28px,3.6vw,38px)] font-extrabold leading-tight">Rent Differently. Live More Freely.</h2>
            <p className="my-3 text-sm text-[#f1d8d3]">Traditional annual rent payments can make finding a home financially challenging. RENTLIFTED makes renting more accessible through monthly payment arrangements for eligible tenants.</p>
            <Link href="/monthly-rent" className="btn bg-copper text-[#2a1206] hover:bg-[#d48d57]">How Monthly Rent Works</Link>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="text-center">
                <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border border-white/50 bg-white/10"><Icon name={s.icon} className="h-7 w-7" /></span>
                <h3 className="font-bold"><span className="mr-1.5 text-copper">0{i + 1}</span>{s.t}</h3>
                <p className="mt-1.5 text-[12.5px] text-[#f1d8d3]">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className={H2}>Find a Place That Feels Like Home.</h2><p className="mt-1.5 text-mut">Explore our carefully selected properties in great locations.</p></div>
          <Link href="/properties" className="text-[13.5px] font-bold text-maroon">View All Properties →</Link>
        </div>
        {featured.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        ) : <p className="mt-7 rounded-xl bg-cream p-6 text-sm text-mut">New properties are being added. Please check back soon.</p>}
      </section>

      <section id="landlords" className="grid bg-cream lg:grid-cols-[1fr_1.1fr]">
        <img src="/images/modern-house.jpg" alt="Modern two-storey house" loading="lazy" className="h-64 w-full object-cover lg:h-full" />
        <div className="px-5 py-11 sm:px-9">
          <p className="text-xs font-bold tracking-widest text-mut">FOR LANDLORDS</p>
          <h2 className="mt-1 text-[clamp(24px,3vw,32px)] font-extrabold leading-tight text-maroon">Your Property. Our Partnership.</h2>
          <p className="my-3 max-w-lg text-mut">Partner with RENTLIFTED to access vetted tenants, explore upfront payment arrangements for eligible properties, and enjoy professional property management services.</p>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {([["pay", "Upfront rent payments (for eligible arrangements)"], ["users", "Access to prospective tenants"], ["tool", "Property management and maintenance coordination"]] as const).map(([i, t]) => (
              <div key={t} className="flex flex-col gap-2 text-[12.5px] font-semibold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-maroon"><Icon name={i} className="h-[18px] w-[18px]" /></span>{t}</div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3"><Link href="/partner" className="btn btn-p">Partner With Us →</Link><Link href="/signup?role=landlord" className="btn btn-o">List Your Property</Link></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 md:grid-cols-2">
        {[
          { t: "Buying Property?", d: "Your next property could be here. Explore houses and apartments that match your needs and budget.", b: "Explore Properties →", h: "/properties?type=sale", img: "duplex-4bed" },
          { t: "Selling Property?", d: "Reach genuine buyers through RENTLIFTED. List your property and connect with prospective buyers.", b: "List Your Property →", h: "/sell", img: "apartment-2bed" },
        ].map((x) => (
          <div key={x.t} className="grid overflow-hidden rounded-xl border border-line bg-cream sm:grid-cols-[1.2fr_1fr]">
            <div className="p-6"><h3 className="text-xl font-extrabold text-maroon">{x.t}</h3><p className="my-2 mb-4 text-[13px] text-mut">{x.d}</p><Link href={x.h} className="btn btn-p">{x.b}</Link></div>
            <img src={`/images/${x.img}.jpg`} alt="" loading="lazy" className="h-40 w-full object-cover sm:h-full" />
          </div>
        ))}
      </section>

      <section id="why" className="mx-auto grid max-w-6xl items-center gap-6 px-5 pb-12 md:grid-cols-2 lg:grid-cols-[240px_repeat(4,1fr)]">
        <h2 className="text-xl font-extrabold text-maroon md:col-span-2 lg:col-span-1">Why Choose RENTLIFTED?<span className="block text-[15px] text-[#9a5a2c]">A Better Property Experience.</span></h2>
        {WHY.map(([t, d, i]) => (
          <div key={t} className="flex items-start gap-3"><span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-cream text-maroon"><Icon name={i} className="h-[18px] w-[18px]" /></span>
            <div><h3 className="text-sm font-bold">{t}</h3><p className="text-xs text-mut">{d}</p></div></div>
        ))}
      </section>
    </main>
  );
}
