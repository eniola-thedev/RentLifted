import Icon from "@/components/Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

// Page header shared by the company and support pages: eyebrow, title, one-paragraph intro, optional actions.
export function InfoHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children?: React.ReactNode }) {
  return (
    <section className="bg-gradient-to-r from-cream via-cream to-white">
      <div className="mx-auto max-w-4xl px-5 pb-12 pt-12 sm:pt-16">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9a5a2c]">{eyebrow}</p>
        <h1 className="mt-2 max-w-2xl text-balance text-[clamp(32px,4.6vw,48px)] font-extrabold leading-[1.1] tracking-tight text-maroon">{title}</h1>
        <p className="mt-4 max-w-2xl text-pretty text-[17px] leading-relaxed text-mut">{intro}</p>
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function InfoSection({ id, title, intro, children, tone = "plain" }: { id?: string; title: string; intro?: string; children: React.ReactNode; tone?: "plain" | "cream" }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={`scroll-mt-24 ${tone === "cream" ? "bg-cream" : ""}`}>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <h2 id={id ? `${id}-h` : undefined} className="text-balance text-[clamp(24px,3vw,30px)] font-extrabold leading-tight text-maroon">{title}</h2>
        {intro && <p className="mt-2 max-w-2xl text-pretty text-mut">{intro}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

// A grid of short points, each with an icon, a title and a sentence.
export function Points({ items, cols = 3 }: { items: readonly (readonly [IconName, string, string])[]; cols?: 2 | 3 }) {
  return (
    <ul className={`grid gap-6 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map(([icon, t, d]) => (
        <li key={t} className="flex gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-maroon text-white"><Icon name={icon} className="h-5 w-5" /></span>
          <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm leading-relaxed text-mut">{d}</p></div>
        </li>
      ))}
    </ul>
  );
}

// Numbered steps for "how it works" sections.
export function Steps({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {items.map(([t, d], i) => (
        <li key={t} className="flex gap-4 rounded-xl border border-line bg-white p-5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-cream text-sm font-extrabold tabular-nums text-maroon">{i + 1}</span>
          <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm leading-relaxed text-mut">{d}</p></div>
        </li>
      ))}
    </ol>
  );
}

// Closing call to action at the bottom of a page.
export function InfoCta({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-16 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-br from-deep to-maroon p-7 text-white sm:p-9">
        <div className="max-w-lg"><h2 className="text-2xl font-extrabold">{title}</h2><p className="mt-1.5 text-[#f1d8d3]">{text}</p></div>
        <div className="flex flex-wrap gap-3">{children}</div>
      </div>
    </section>
  );
}
