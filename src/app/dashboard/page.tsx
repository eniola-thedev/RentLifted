import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { homeFor } from "@/lib/types";

export default async function Dashboard() {
  const { profile } = await requireProfile();
  redirect(homeFor(profile.role));
}
