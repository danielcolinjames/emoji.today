import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "emoji.today",
  description: "emoji.today",
  openGraph: {
    images: "https://emoji.today/og.png",
  },
  twitter: {
    card: "summary_large_image",
    site: "emoji.today",
    description: `emoji.today`,
    title: `emoji.today`,
    images: ["https://emoji.today/og.png"],
  },
};

import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Font files can be colocated inside of `app`
const satoshiFont = localFont({
  src: "../assets/fonts/Satoshi-Variable.ttf",
  display: "swap",
  variable: "--font-satoshi",
});

// import { trackEvent } from 'fathom-client';
// In your component
// const handleClick = () => {
//   trackEvent('GOAL_ID', 0); // 0 is the value (optional)
// };

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
        <main className="min-h-dvh bg-[#050505] relative pb-10 sm:pb-24">
          <Navbar />
          <div className="w-full pt-[45px] sm:pt-[50px]">{children}</div>
          <Footer />
        </main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
