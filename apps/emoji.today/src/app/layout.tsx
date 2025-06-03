import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Providers } from "./providers";
import { getSession } from "@/auth";
import "./globals.css";
import { FrameProvider } from '@/components/providers/FrameProvider';
import { Navbar } from '@/components/Navbar';
import { EnvironmentBadge } from '@/components/EnvironmentBadge';

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
          <FrameProvider>
            <Navbar />
            <EnvironmentBadge />
            <main className="bg-[#050505]">
              <div className="w-full">{children}</div>
              <Footer />
              <DebugImageButton />
            </main>
          </FrameProvider>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html >
  );
}
