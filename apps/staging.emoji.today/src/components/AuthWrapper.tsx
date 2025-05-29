"use client";

import { useSession } from "next-auth/react";
import { useFrame } from "./providers/FrameProvider";
import { Button } from "./ui/Button";
import { SignIn } from "./SignIn";
import { Navbar } from "./Navbar";

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export function AuthWrapper({
  children,
  requireAuth = false,
  fallback
}: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const { context } = useFrame();

  // If auth is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-brand-primary">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in to vote</h2>
        <p className="text-gray-600 mb-6">
          {context
            ? "Connect your Farcaster account to participate in today's emoji vote."
            : "Open this page in Farcaster to vote on today's emoji."}
        </p>
        {context ? (
          <SignIn />
        ) : (
          <Button
            onClick={() => window.open("https://warpcast.com/~/add/emoji.today", "_blank")}
            className="bg-brand-primary hover:bg-brand-500"
          >
            Open in Farcaster
          </Button>
        )}
      </div>
    );
  }

  // Authenticated - show navbar and children
  return (
    <>
      <Navbar />
      {children}
    </>
  );
} 