"use client";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

declare global { interface Window { SmileIdentity?: (config: Record<string, unknown>) => void } }

export default function SmileVerify() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function start() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/smile/token", { method: "POST" });
      if (!res.ok || !window.SmileIdentity) throw new Error("start");
      const { token, config } = await res.json();
      window.SmileIdentity({
        token, product: "biometric_kyc", ...config,
        id_selection: { NG: ["BVN", "NIN"] },
        onResult: (r: { status: string }) => {
          if (r.status === "success") router.push(`/kyc?notice=${encodeURIComponent("Submitted. We’re checking your details. This usually takes about a minute, so refresh to see the result.")}`);
          else { if (r.status === "failure") setMsg("Verification didn’t complete. Please try again."); setBusy(false); }
        },
      });
    } catch { setMsg("We couldn’t start verification. Please try again."); setBusy(false); }
  }

  return (
    <div className="grid gap-4">
      <Script src="https://cdn.usesmileid.com/inline/v12/js/script.min.js" strategy="afterInteractive" />
      <ul className="grid gap-2 rounded-xl bg-cream p-4 text-sm text-mut">
        <li>1. Agree to the consent notice.</li><li>2. Choose BVN or NIN and enter the number.</li><li>3. Take a selfie. Use good light and face the camera.</li>
      </ul>
      {msg && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
      <button onClick={start} disabled={busy} className="btn btn-p disabled:opacity-60">{busy ? "Opening…" : "Verify with BVN or NIN"}</button>
      <p className="text-xs text-mut">Your details are checked by Smile ID against the official record. We keep only the last 4 digits of your number.</p>
    </div>
  );
}
