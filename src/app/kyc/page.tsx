import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export default async function Kyc({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  await requireProfile();
  redirect(`/profile${notice ? `?notice=${encodeURIComponent(notice)}` : ""}`); // verification lives on the profile page
}
