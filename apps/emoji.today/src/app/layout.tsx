import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "emoji.today",
  description: "emoji.today",
  openGraph: {
    images: "https://emoji.today/og-1.png",
  },
  twitter: {
    card: "summary_large_image",
    site: "emoji.today",
    description: `emoji.today`,
    title: `emoji.today`,
    images: ["https://emoji.today/og-1.png"],
  },
};

import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const satoshiFont = localFont({
  src: "../assets/fonts/Satoshi-Variable.ttf",
  display: "swap",
  variable: "--font-satoshi",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${satoshiFont.variable} dark`}>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" content="#000000" />
      <body>
        <GoogleAnalytics />
        <main className="min-h-dvh bg-[#050505] relative pb-10 sm:pb-24">
          <Navbar />
          <div className="w-full">{children}</div>
          <Footer />
        </main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
