import Link from "next/link";
import Icon from "@/components/Icon";
import { NG_STATES } from "@/lib/ng";
import { BEDROOM_OPTIONS, PROPERTY_TYPES } from "@/lib/propertyTypes";
import type { Filters } from "@/lib/properties";

const sel = "w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm outline-none focus:border-maroon focus:ring-2 focus:ring-copper/40";

// Compact: one search row, with the other filters folded away until asked for.
// A plain GET form, so filters live in the URL: they work without JavaScript, survive refresh and can be shared.
export default function PropertyFilters({ action, f }: { action: string; f: Filters }) {
  const extra = [f.state, f.ptype, f.beds, f.min || f.max].filter(Boolean).length;
  return (
    <form action={action} aria-label="Filter properties" className="rounded-xl border border-line bg-white p-2">
      <div className="flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 focus-within:ring-2 focus-within:ring-copper/40">
          <Icon name="search" className="h-4 w-4 flex-none text-mut" />
          <span className="sr-only">City or area</span>
          <input name="q" defaultValue={f.q} placeholder="Search city or area" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
        </label>
        <button className="btn btn-p !px-4 !py-2">Search</button>
        {(extra > 0 || f.q) && <Link href={action} className="btn btn-o !px-3 !py-2">Clear</Link>}
      </div>
      <details open={extra > 0} className="group mt-1">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-maroon">
          Filters{extra > 0 && <span className="rounded-full bg-maroon px-1.5 text-[11px] text-white">{extra}</span>}
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-5">
          <label className="text-[11px] font-bold text-mut">State
            <select name="state" defaultValue={f.state ?? ""} className={sel}><option value="">All</option>{NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </label>
          <label className="text-[11px] font-bold text-mut">Type
            <select name="ptype" defaultValue={f.ptype ?? ""} className={sel}><option value="">Any</option>{PROPERTY_TYPES.filter(([v]) => v !== "land").map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label className="text-[11px] font-bold text-mut">Bedrooms
            <select name="beds" defaultValue={f.beds ?? ""} className={sel}><option value="">Any</option>{BEDROOM_OPTIONS.map((b) => <option key={b} value={b}>{b === "5" ? "5+" : b}</option>)}</select>
          </label>
          <label className="text-[11px] font-bold text-mut">Min ₦/month
            <input name="min" type="number" inputMode="numeric" min={0} step={5000} defaultValue={f.min} placeholder="0" className={`${sel} tabular-nums`} />
          </label>
          <label className="text-[11px] font-bold text-mut">Max ₦/month
            <input name="max" type="number" inputMode="numeric" min={0} step={5000} defaultValue={f.max} placeholder="Any" className={`${sel} tabular-nums`} />
          </label>
        </div>
      </details>
    </form>
  );
}
