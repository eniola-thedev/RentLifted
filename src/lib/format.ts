export const naira = (n: number) => "₦" + new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n);
export const photoUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${path}`;
export const videoUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-videos/${path}`;
// Listing media rules (also enforced in the database, migration 0011).
export const MEDIA = { minPhotos: 2, maxPhotos: 5, minVideos: 1, maxVideos: 2, photoMB: 5, videoMB: 50 } as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const STATUS_LABEL: Record<string, [string, string]> = {
  draft: ["Draft", "border border-line bg-white text-mut"], pending_review: ["In review", "bg-copper/30 text-[#7a4a1e]"], published: ["Live", "bg-maroon text-white"],
  rented: ["Rented", "bg-cream text-maroon"], sold: ["Sold", "bg-cream text-maroon"], archived: ["Archived", "border border-line bg-white text-mut"],
};
export const APP_STATUS: Record<string, [string, string]> = {
  pending: ["In review", "bg-copper/30 text-[#7a4a1e]"], approved: ["Approved", "bg-maroon text-white"],
  declined: ["Declined", "bg-red-100 text-red-800"], withdrawn: ["Withdrawn", "border border-line bg-white text-mut"],
};
export const AFFORD_LABEL: Record<string, string> = { comfortable: "Comfortable", eligible: "Eligible", not_eligible: "Not eligible" };
export const fmtDate = (d: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
