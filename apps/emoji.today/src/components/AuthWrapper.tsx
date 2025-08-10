"use client";

import { useSession, signOut } from "next-auth/react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

// Enhanced signOut function that clears all session data
export const clearSessionAndSignOut = async () => {
  // Clear all NextAuth cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    if (name.trim().includes('next-auth')) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
      // Also clear for different paths and domains
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    }
  });

  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Clear any iframe cookies (for Farcaster)
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'CLEAR_COOKIES' }, '*');
    }
  } catch (e) {
    // Ignore cross-origin errors
  }

  // Sign out with NextAuth
  await signOut({ redirect: false });

  // Force a hard reload to clear any cached state
  window.location.href = '/';
};

export function AuthWrapper({
  children,
  requireAuth = false,
  fallback
}: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const { context } = useMiniKit();
  const isMiniAppAuthed = Boolean(context?.user);
  const router = useRouter();

  // Handle redirect when unauthenticated and auth is required
  useEffect(() => {
    if (requireAuth && status === "unauthenticated" && !isMiniAppAuthed) {
      router.push('/');
    }
  }, [requireAuth, status, isMiniAppAuthed, router]);

  // If auth is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#050505] text-white">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  // Not authenticated - show loading spinner while redirecting
  if (status === "unauthenticated" && !isMiniAppAuthed) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#050505] text-white">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  // Authenticated - show children
  return (
    <>
      {children}
    </>
  );
} 