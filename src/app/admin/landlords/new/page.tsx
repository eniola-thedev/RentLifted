import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import LandlordForm from "@/components/LandlordForm";
import { requireProfile } from "@/lib/auth";

export default async function NewOfflineLandlord({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireProfile("admin");
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <AdminNav />
      <Link href="/admin/landlords" className="text-sm font-bold text-maroon">← Landlords</Link>
      <h1 className="mt-4 text-3xl font-extrabold text-maroon">Add a landlord</h1>
      <p className="mt-1 text-sm text-mut">Fill this in during the visit. You can save now and add the ID or bank account later, but a listing can’t go live until both are in.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6"><LandlordForm /></div>
    </main>
  );
}
