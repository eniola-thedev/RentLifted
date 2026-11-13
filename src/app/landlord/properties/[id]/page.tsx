import ListingEditor from "@/components/ListingEditor";
import { requireProfile } from "@/lib/auth";

export default async function EditProperty({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string; reference?: string }> }) {
  const [{ id }, sp, { user, profile }] = await Promise.all([params, searchParams, requireProfile("landlord")]);
  return <ListingEditor id={id} userId={user.id} profile={profile} base="/landlord/properties" {...sp} />;
}
