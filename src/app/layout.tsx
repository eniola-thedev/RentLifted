import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterGate from "@/components/FooterGate";

export const metadata: Metadata = {
  title: "RENTLIFTED – Elevating the Way We Live",
  description: "Rent monthly, buy property and land, and manage your property with RENTLIFTED.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        <Header />
        {children}
        <FooterGate><Footer /></FooterGate>
      </body>
    </html>
  );
}
