"use client";

import { useSession } from "next-auth/react";
import { useFrame } from "./providers/FrameProvider";
import { Button } from "./ui/Button";
import { SignIn } from "./SignIn";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const router = useRouter();

  // Handle redirect when unauthenticated and auth is required
  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push('/');
    }
  }, [requireAuth, status, router]);

  // If auth is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#050505] text-white">
        <div className="animate-pulse text-brand-yellow">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show loading spinner while redirecting
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#050505] text-white">
        <div className="animate-pulse text-brand-yellow">Loading...</div>
      </div>
    );
  }

  // Authenticated - show navbar and children
  return (
    <>
      {children}
    </>
  );
} 