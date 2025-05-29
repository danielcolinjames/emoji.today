import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSession } from "~/auth";
import { Providers } from "./providers";
import "./globals.css";

const satoshiFont = localFont({
  src: "../assets/fonts/Satoshi-Variable.ttf",
  display: "swap",
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: "emoji.today",
  description: "Vote for the emoji that best represents today",
  openGraph: {
    images: "https://emoji.today/og-1.png",
  },
  twitter: {
    card: "summary_large_image",
    site: "emoji.today",
    description: "Vote for the emoji that best represents today",
    title: "emoji.today",
    images: ["https://emoji.today/og-1.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${satoshiFont.variable} dark`}>
      <body className="font-satoshi">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
