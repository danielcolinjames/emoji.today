"use client";

import { useSession, signOut } from "next-auth/react";
import { useFrame } from "./providers/FrameProvider";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const { context } = useFrame();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const username = context?.user?.username || `FID ${session?.user?.fid}`;
  const profileImage = context?.user?.pfpUrl;

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!session?.user) {
    // Unauthenticated state: centered logo only
    return (
      <nav className="absolute top-6 sm:top-10 left-1/2 transform -translate-x-1/2 z-50">
        <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/images/logo-white.svg"
            alt="emoji.today"
            width={48}
            height={48}
            className="w-[28px] h-[28px] sm:w-[48px] sm:h-[48px]"
          />
        </Link>
      </nav>
    );
  }

  // Authenticated state: logo on left, profile on right
  return (
    <nav className="absolute top-4 sm:top-10 left-0 right-0 z-50 px-4 sm:px-8 lg:px-10">
      <div className="flex justify-between items-center">
        {/* Logo - Left Side */}
        <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/images/logo-white.svg"
            alt="emoji.today"
            width={48}
            height={48}
            className="w-[28px] h-[28px] sm:w-[48px] sm:h-[48px]"
          />
        </Link>

        {/* Profile Section - Right Side */}
        <div className="flex items-center relative">
          {/* Profile Picture with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="focus:outline-none rounded-full"
            >
              {profileImage && !imageError ? (
                <img
                  className="w-[28px] h-[28px] sm:w-[48px] sm:h-[48px] block rounded-full object-cover"
                  src={profileImage}
                  alt={username}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-[28px] h-[28px] sm:w-[48px] sm:h-[48px] rounded-full bg-orange-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                  {getInitials(username)}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-neutral-900 ring-1 ring-white/10">
                <div className="py-1">
                  {/* Welcome text in dropdown */}
                  <div className="px-4 py-2 text-sm text-neutral-400 border-b border-neutral-700">
                    {username} is here!
                  </div>

                  {/* Profile option (disabled) */}
                  <button
                    onClick={() => {
                      setShowComingSoon(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    Profile{" "}
                    <span
                      className={`text-neutral-500 transition-opacity duration-300 ${showComingSoon ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                      (coming soon)
                    </span>
                  </button>

                  {/* Log out */}
                  <button
                    onClick={async () => {
                      setIsMenuOpen(false);
                      try {
                        // Sign out first to clear session immediately
                        await signOut({ redirect: false });
                        // Then navigate to home
                        router.push('/');
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Navigate anyway in case of error
                        router.push('/');
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
