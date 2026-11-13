import { redirect } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import SearchBox from "@/components/SearchBox";
import { getProperties } from "@/lib/properties";

const TITLES: Record<string, string> = { rent: "Properties for Rent", sale: "Properties for Sale", land: "Land for Sale" };

export default async function Properties({ searchParams }: { searchParams: Promise<{ type?: string; q?: string; ptype?: string }> }) {
  const sp = await searchParams;
  if (sp.type === "land") redirect("/land"); // land sales aren't available yet
  const list = await getProperties(sp);
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-6 text-3xl font-extrabold text-maroon">{TITLES[sp.type ?? ""] ?? "All Properties"}</h1>
      <SearchBox initial={sp} />
      <p className="mb-5 mt-8 text-sm text-mut" role="status">{list.length} {list.length === 1 ? "property" : "properties"} found</p>
      {list.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
      ) : <p className="rounded-xl bg-cream p-8 text-center text-mut">No properties match your search. Try a different location or property type.</p>}
    </main>
  );
}
