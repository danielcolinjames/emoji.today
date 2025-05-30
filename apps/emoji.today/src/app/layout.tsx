import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Providers } from "./providers";
import { getSession } from "@/auth";
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
  other: {
    "fc:frame": "https://emoji.today/.well-known/farcaster.json",
  },
};

import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DebugImageButton } from "@/components/DebugImageButton";

const satoshiFont = localFont({
  src: "../assets/fonts/Satoshi-Variable.ttf",
  display: "swap",
  variable: "--font-satoshi",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en" className={`${satoshiFont.variable} ${geistSans.variable} ${geistMono.variable} dark`}>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" content="#000000" />
      <body>
        <GoogleAnalytics />
        <Providers session={session}>
          <main className="bg-[#050505]">
            <Navbar />
            <div className="w-full">{children}</div>
            <Footer />
            <DebugImageButton />
          </main>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html >
  );
}
