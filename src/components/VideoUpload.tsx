"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerVideo } from "@/app/landlord/properties/actions";
import { MEDIA, VIDEO_TYPES } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

// Uploads straight to storage from the browser (videos are too large for a form post), then records the upload.
export default function VideoUpload({ propertyId, userId }: { propertyId: string; userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    if (!VIDEO_TYPES.includes(f.type)) return setError("Videos must be MP4, WebM or MOV.");
    if (f.size > MEDIA.videoMB * 1024 * 1024) return setError(`Each video must be under ${MEDIA.videoMB} MB. Try a shorter clip.`);
    setBusy(true);
    const ext = f.type === "video/webm" ? "webm" : f.type === "video/quicktime" ? "mov" : "mp4";
    const path = `${userId}/${propertyId}/${crypto.randomUUID()}.${ext}`;
    const up = await createClient().storage.from("property-videos").upload(path, f, { contentType: f.type });
    if (up.error) { setBusy(false); return setError("Upload failed. Check your connection and try again."); }
    const res = await registerVideo(propertyId, path);
    setBusy(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <label className={`btn btn-o !py-2 ${busy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
        {busy ? "Uploading video…" : "Add a video"}
        <input type="file" accept={VIDEO_TYPES.join(",")} onChange={onChange} disabled={busy} className="sr-only" />
      </label>
      <p className="mt-1 text-xs text-mut">MP4, WebM or MOV, up to {MEDIA.videoMB} MB. A short walk-through works best.</p>
      {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      {busy && <p role="status" className="sr-only">Uploading video</p>}
    </div>
  );
}
