import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterGate from "@/components/FooterGate";
import NavProgress from "@/components/NavProgress";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "RENTLIFTED – Elevating the Way We Live",
  description: "Rent monthly, buy property and land, and manage your property with RENTLIFTED.",
};

// Runs as the page is parsed. Skips the splash after the first page of a session; otherwise hides it once the
// page has loaded, showing it at least 500ms (no flash) and at most 2.5s. CSS also hides it at 3s if this never runs.
const SPLASH_SCRIPT = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem("rl_splash")){d.classList.add("no-splash");return}sessionStorage.setItem("rl_splash","1")}catch(e){}
var t0=Date.now(),done=false;function hide(){if(done)return;done=true;setTimeout(function(){d.classList.add("splash-done")},Math.max(0,500-(Date.now()-t0)))}
if(document.readyState==="complete")hide();else window.addEventListener("load",hide);setTimeout(hide,2500)})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning /* the splash script adds a class to <html> before React loads */>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        {/* Splash: the logo while the site first opens, once per browser session. Plain HTML + inline script
            so it covers the page before React loads. Styles in globals.css (#splash). */}
        <div id="splash" aria-hidden="true">
          <img src="/logo.svg" alt="" className="splash-logo" />
          <span className="splash-bar"><span /></span>
        </div>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        <Suspense fallback={null}><NavProgress /></Suspense>
        <Header />
        {children}
        <FooterGate><Footer /></FooterGate>
      </body>
    </html>
  );
}
