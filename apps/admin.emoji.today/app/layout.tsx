import "./globals.css";
import type { ReactNode } from "react";
import { GeistSans, GeistMono } from "geist/font";
import Header from "../components/Header";

export const metadata = {
  title: "emoji.today admin",
  description: "Admin dashboard for emoji.today",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-black text-white font-geist-sans min-h-screen flex flex-col">
        {/* Global header */}
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
} 