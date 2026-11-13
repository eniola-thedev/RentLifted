"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { PROPERTY_TYPES } from "@/lib/propertyTypes";

const TABS = [["rent", "Rent"], ["sale", "Buy"], ["land", "Land"]] as const;
const HOMES = PROPERTY_TYPES.filter(([v]) => v !== "land");
const TYPES: Record<string, readonly (readonly [string, string])[]> = { rent: HOMES, sale: HOMES, land: [["land", "Land"]] };

export default function SearchBox({ initial = {} }: { initial?: { type?: string; q?: string; ptype?: string } }) {
  const [type, setType] = useState(initial.type && TYPES[initial.type] ? initial.type : "rent");
  return (
    <div>
      <div role="tablist" aria-label="Search type" className="ml-3 flex gap-1">
        {TABS.map(([v, label]) => (
          <button key={v} type="button" role="tab" aria-selected={type === v} onClick={() => setType(v)}
            className={`rounded-t-lg px-5 py-2 text-sm font-bold sm:px-7 ${type === v ? "bg-maroon text-white" : "bg-[#e9dad3] text-ink"}`}>
            {label}{v === "land" && <span className="ml-1.5 rounded bg-copper px-1.5 py-0.5 text-[10px] text-[#2a1206]">Soon</span>}
          </button>
        ))}
      </div>
      {type === "land" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-xl">
          <p className="text-sm text-mut"><b className="block text-base text-maroon">Land is coming soon</b>We’re getting land sales ready, with verified titles and safe payments.</p>
          <a href="/land" className="btn btn-o">Learn more</a>
        </div>
      ) : <form action="/properties" className="grid gap-2 rounded-xl bg-white p-3 shadow-xl md:grid-cols-[1fr_1fr_1fr_auto]">
        <input type="hidden" name="type" value={type} />
        <label className="flex items-center gap-3 border-b border-line px-3 py-2 text-xs font-semibold text-mut md:border-b-0 md:border-r">
          <Icon name="pin" className="h-5 w-5 flex-none text-maroon" />
          <span className="flex-1">Location<input name="q" defaultValue={initial.q} placeholder="Ibadan, Lagos, Abuja…" className="block w-full bg-transparent text-sm font-medium text-ink outline-none" /></span>
        </label>
        <label className="flex items-center gap-3 border-b border-line px-3 py-2 text-xs font-semibold text-mut md:border-b-0 md:border-r">
          <Icon name="home" className="h-5 w-5 flex-none text-maroon" />
          <span className="flex-1">Property type
            <select name="ptype" key={type} defaultValue={initial.ptype} className="block w-full bg-transparent text-sm font-medium text-ink outline-none">
              {type !== "land" && <option value="">Any</option>}
              {TYPES[type].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></span>
        </label>
        <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-mut">
          <Icon name="pay" className="h-5 w-5 flex-none text-maroon" />
          <span>Payment preference<span className="block text-sm font-medium text-ink">{type === "rent" ? "Monthly" : "Outright purchase"}</span></span>
        </div>
        <button className="btn btn-p"><Icon name="search" className="h-4 w-4" />Find Properties</button>
      </form>}
    </div>
  );
}
