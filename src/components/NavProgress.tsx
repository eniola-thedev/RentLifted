"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Site-wide loading feedback:
// 1. A thin bar across the top while moving to another page (link clicks and form submits).
// 2. A spinner on the button that submitted a form, so people don't click twice.
// Both stop when the new page (or URL) arrives. Styles live in globals.css (.nav-progress, [data-pending]).
export default function NavProgress() {
  const path = usePathname(), search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timers = useRef<number[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const stopButtons = () => document.querySelectorAll<HTMLElement>("[data-pending]").forEach((b) => { b.removeAttribute("data-pending"); b.removeAttribute("aria-busy"); });
  const start = () => {
    clear();
    // Wait a moment so instant navigations don't flash the bar.
    timers.current.push(window.setTimeout(() => setState("loading"), 120));
    // Safety net: never leave a bar or spinner running if no navigation follows.
    timers.current.push(window.setTimeout(() => { setState("idle"); stopButtons(); }, 15000));
  };

  // A new page or URL arrived: finish the bar and release any pending buttons.
  useEffect(() => {
    clear();
    stopButtons();
    setState((s) => (s === "loading" ? "done" : "idle"));
    const t = window.setTimeout(() => setState("idle"), 350);
    return () => clearTimeout(t);
  }, [path, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or #anchor
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (e.defaultPrevented || form.method === "dialog") return;
      start();
      const btn = e.submitter as HTMLElement | null;
      // Buttons that already show their own spinner (sign in, sign up) are left alone.
      if (btn && !btn.classList.contains("auth-submit")) {
        // Not "disabled": a disabled button would drop its name/value (e.g. intent=submit) from the form data.
        window.setTimeout(() => { btn.setAttribute("data-pending", ""); btn.setAttribute("aria-busy", "true"); }, 0);
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit, true); clear(); };
  }, []);

  return (
    <>
      <div aria-hidden="true" className={`nav-progress ${state === "loading" ? "is-loading" : state === "done" ? "is-done" : ""}`} />
      <span role="status" aria-live="polite" className="sr-only">{state === "loading" ? "Loading" : ""}</span>
    </>
  );
}
