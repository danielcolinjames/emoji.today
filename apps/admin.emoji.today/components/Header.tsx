"use client";

import { useCallback } from "react";
import { LogOut } from "lucide-react";

export default function Header() {
  const handleLogout = useCallback(() => {
    // Attempt to "logout" from HTTP Basic Auth by requesting the site again with
    // bogus credentials. Browsers will then re-prompt for login. Works in most
    // modern browsers except Safari iOS < 15.
    if (typeof window === "undefined") return;
    const { host } = window.location;
    window.location.href = `https://logout:invalid@${host}`;
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-black/70 px-6 py-4 backdrop-blur-md">
      <h1 className="text-lg font-bold leading-none tracking-tight">
        <span className="text-neutral-400">emoji.today</span>
        <span className="mx-2 text-neutral-600">/</span>
        <span className="text-white">admin</span>
      </h1>
      <button
        onClick={handleLogout}
        className="group flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm transition-colors hover:bg-white/10"
        title="Log out"
      >
        <LogOut className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-white" />
        <span className="text-neutral-300 group-hover:text-white">Log out</span>
      </button>
    </header>
  );
} 