import { createClient } from "@/lib/supabase/server";
import { isPropertyType, type PropertyType } from "@/lib/propertyTypes";
import { videoUrl } from "@/lib/format";

export type Property = {
  id: string; title: string; description: string | null;
  purpose: "rent" | "sale"; property_type: PropertyType;
  bedrooms: number | null; bathrooms: number | null; land_size_sqm: number | null;
  state: string; city: string; area: string | null; address: string | null;
  annual_rent: number | null; monthly_rent: number | null; monthly_rent_available: boolean; sale_price: number | null;
  images: string[]; videos?: string[];
};
export type Filters = { type?: string; q?: string; ptype?: string; state?: string; beds?: string; min?: string; max?: string; limit?: number };
export * from "@/lib/propertyTypes";
const num = (v?: string) => { const n = Number(v); return v && Number.isFinite(n) && n > 0 ? n : null; };

const DEMO = process.env.NEXT_PUBLIC_DEMO_DATA === "true";
const base = { description: null, bathrooms: null, bedrooms: null, land_size_sqm: null, address: null, state: "Oyo", city: "Ibadan", monthly_rent: null, monthly_rent_available: false, annual_rent: null, sale_price: null } as const;
const SAMPLE: Property[] = [
  { ...base, id: "s1", title: "3 Bedroom Apartment", purpose: "rent", property_type: "apartment", bedrooms: 3, bathrooms: 3, area: "Akobo", annual_rent: 1200000, monthly_rent: 100000, monthly_rent_available: true, images: ["/images/apartment-3bed.jpg"], description: "Spacious three bedroom apartment in a gated compound with 24-hour security and ample parking." },
  { ...base, id: "s2", title: "4 Bedroom Detached Duplex", purpose: "sale", property_type: "duplex", bedrooms: 4, bathrooms: 5, area: "Jericho", sale_price: 180000000, images: ["/images/duplex-4bed.jpg"], description: "Detached duplex with a boys’ quarters, in a quiet and well-developed neighbourhood." },
  { ...base, id: "s3", title: "Residential Land", purpose: "sale", property_type: "land", land_size_sqm: 600, area: "Moniya", sale_price: 15000000, images: ["/images/land.jpg"], description: "600 sqm of dry, level residential land with accessible road frontage." },
  { ...base, id: "s4", title: "2 Bedroom Apartment", purpose: "rent", property_type: "apartment", bedrooms: 2, bathrooms: 2, area: "Bodija", annual_rent: 800000, monthly_rent: 75000, monthly_rent_available: true, images: ["/images/apartment-2bed.jpg"], description: "Well-finished two bedroom apartment close to shops and public transport." },
];

const imgUrl = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${p}`;
type MediaRow = { path: string; position: number }[] | null | undefined;
type Row = Omit<Property, "images" | "videos"> & { property_images: MediaRow; property_videos?: MediaRow };
const ordered = (m: MediaRow, url: (p: string) => string) => [...(m ?? [])].sort((a, b) => a.position - b.position).map((i) => url(i.path));
const fromRow = ({ property_images, property_videos, ...r }: Row): Property => ({
  ...r, images: ordered(property_images, imgUrl), videos: ordered(property_videos, videoUrl),
});

export async function getProperties(f: Filters = {}): Promise<Property[]> {
  if (DEMO) {
    const q = (f.q ?? "").toLowerCase();
    return SAMPLE.filter((p) =>
      p.property_type !== "land" &&
      (f.type === "rent" ? p.purpose === "rent" : f.type === "sale" ? p.purpose === "sale" : true) &&
      (!f.ptype || p.property_type === f.ptype.toLowerCase()) &&
      (!f.state || p.state === f.state) &&
      (!num(f.beds) || (num(f.beds)! >= 5 ? (p.bedrooms ?? 0) >= 5 : p.bedrooms === num(f.beds))) &&
      (!num(f.min) || (p.monthly_rent ?? 0) >= num(f.min)!) && (!num(f.max) || (p.monthly_rent != null && p.monthly_rent <= num(f.max)!)) &&
      (!q || `${p.title} ${p.area} ${p.city} ${p.state}`.toLowerCase().includes(q))
    ).slice(0, f.limit ?? 48);
  }
  const supabase = await createClient();
  let query = supabase.from("properties").select("*, property_images(path, position)").eq("status", "published");
  if (f.type === "rent") query = query.eq("purpose", "rent");
  query = query.neq("property_type", "land"); // land sales aren't available yet, so land never shows in results
  if (f.type === "sale") query = query.eq("purpose", "sale").neq("property_type", "land");
  if (f.ptype && isPropertyType(f.ptype.toLowerCase())) query = query.eq("property_type", f.ptype.toLowerCase());
  if (f.state) query = query.eq("state", f.state);
  const beds = num(f.beds), min = num(f.min), max = num(f.max);
  if (beds) query = beds >= 5 ? query.gte("bedrooms", 5) : query.eq("bedrooms", beds);
  if (min) query = query.gte("monthly_rent", min); // price filters use the monthly rent tenants actually pay
  if (max) query = query.lte("monthly_rent", max);
  const q = (f.q ?? "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  if (q) query = query.or(`title.ilike.%${q}%,area.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,address.ilike.%${q}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(f.limit ?? 48);
  return ((data ?? []) as Row[]).map(fromRow);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function getProperty(id: string): Promise<Property | null> {
  if (DEMO) return SAMPLE.find((p) => p.id === id) ?? null;
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("*, property_images(path, position), property_videos(path, position)").eq("id", id).eq("status", "published").maybeSingle();
  return data ? fromRow(data as Row) : null;
}
