import Link from "next/link";

export default function AdminNav() {
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Admin">
      <Link href="/admin/kyc" className="btn btn-o flex-none !py-2">KYC review</Link>
      <Link href="/admin/listings" className="btn btn-o flex-none !py-2">Listing review</Link>
      <Link href="/admin/properties" className="btn btn-o flex-none !py-2">Our listings</Link>
      <Link href="/admin/landlords" className="btn btn-o flex-none !py-2">Landlords</Link>
      <Link href="/admin/applications" className="btn btn-o flex-none !py-2">Applications</Link>
      <Link href="/admin/payouts" className="btn btn-o flex-none !py-2">Payouts</Link>
      <Link href="/admin/messages" className="btn btn-o flex-none !py-2">Messages</Link>
    </nav>
  );
}
