"use client";

import { useSession, signOut } from "next-auth/react";
import { useFrame } from "./providers/FrameProvider";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const { context } = useFrame();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!session?.user) return null;

  const username = context?.user?.username || `FID ${session.user.fid}`;
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

  return (
    <nav className="bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <Image src="/images/logo-white.svg" alt="emoji.today" width={32} height={32} />
            <div className="flex items-center ml-2">
              <Link href="/" className="text-xl font-bold text-white">
                emoji<span className="text-neutral-500">.today</span>
              </Link>
            </div>
          </div>

          {/* Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
              >
                {profileImage && !imageError ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={profileImage}
                    alt={username}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-medium">
                    {getInitials(username)}
                  </div>
                )}
                <span className="hidden md:block text-white font-medium">
                  {username}
                </span>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''
                    }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <Link
                      href="/vote"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Vote Today
                    </Link>
                    <Link
                      href="/terms"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Terms & Conditions
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 