import AdminNav from "@/components/AdminNav";
import ListingEditor from "@/components/ListingEditor";
import { requireProfile } from "@/lib/auth";

export default async function AdminEditProperty({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const [{ id }, sp, { user, profile }] = await Promise.all([params, searchParams, requireProfile("admin")]);
  return (<>
    <div className="mx-auto max-w-2xl px-5 pt-8"><AdminNav /></div>
    <ListingEditor id={id} userId={user.id} profile={profile} base="/admin/properties" error={sp.error} notice={sp.notice} />
  </>);
}
