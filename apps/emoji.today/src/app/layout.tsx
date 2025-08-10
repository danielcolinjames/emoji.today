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
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      button: {
        title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'emoji.today'}`,
        action: {
          type: "launch_frame",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'emoji.today',
          url: process.env.NEXT_PUBLIC_URL,
          splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
          splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
        },
      },
    }),
  },
};

import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UnifiedDebugButton } from "@/components/UnifiedDebugButton";
import { SWRCacheManager } from "@/components/SWRCacheManager";

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
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Sixtyfour+Convergence&display=swap" rel="stylesheet" />
      </head>
      <body>
        <GoogleAnalytics />
        <Providers session={session}>
          <SWRCacheManager />
          <main className="bg-[#050505]">
            <Navbar />
            <div className="w-full">{children}</div>
            <Footer />
            <UnifiedDebugButton />
          </main>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
