import Link from "next/link";
import Icon from "@/components/Icon";
import { naira } from "@/lib/format";
import { typeLabel, type Property } from "@/lib/properties";

export default function PropertyCard({ p }: { p: Property }) {
  const place = [p.area, p.city].filter(Boolean).join(", ");
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative h-44 bg-cream">
        {p.images[0] && <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />}
        {p.monthly_rent_available && <span className="absolute left-2 top-2 rounded-md bg-copper px-2 py-1 text-[11px] font-bold text-[#2a1206]">Monthly Rent Available</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-extrabold">{p.title}</h3>
        <p className="flex items-center gap-1.5 text-[13px] text-mut"><Icon name="pin" className="h-3.5 w-3.5 text-maroon" />{place}</p>
        <p className="flex flex-wrap gap-3 text-xs capitalize text-mut">
          {p.bedrooms != null && <span>{p.bedrooms} Beds</span>}{p.bathrooms != null && <span>{p.bathrooms} Baths</span>}
          {p.land_size_sqm != null && <span>{p.land_size_sqm} sqm</span>}<span>{typeLabel(p.property_type)}</span>
        </p>
        <div className="mt-1 flex-1 text-sm font-extrabold text-maroon">
          {p.purpose === "rent" ? (<>
            <span className="block text-xs font-medium text-mut">Annual Rent: {naira(p.annual_rent ?? 0)}</span>
            {p.monthly_rent != null && <span className="text-[#9a5a2c]">From {naira(p.monthly_rent)}/month</span>}
          </>) : (<><span className="block text-xs font-medium text-mut">Price</span>{naira(p.sale_price ?? 0)}</>)}
        </div>
        <Link href={`/properties/${p.id}`} className="btn btn-p mt-2">View Property →</Link>
      </div>
    </article>
  );
}
