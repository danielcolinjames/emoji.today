"use client";

import { useState } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';

interface ProfilePictureProps {
  username: string;
  size?: 'small' | 'large';
  className?: string;
}

export function ProfilePicture({ username, size = 'large', className = '' }: ProfilePictureProps) {
  const { context } = useMiniKit();
  const [imageError, setImageError] = useState(false);

  const profileImage = context?.user?.pfpUrl;

  // Get initials from username for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const sizeClasses = size === 'small'
    ? 'w-20 h-20 sm:w-32 sm:h-32'
    : 'w-20 h-20 sm:w-32 sm:h-32';

  const textSizeClasses = size === 'small'
    ? 'text-xl sm:text-3xl'
    : 'text-xl sm:text-3xl';

  return (
    <div className={`${className}`}>
      {profileImage && !imageError ? (
        <img
          className={`${sizeClasses} mx-auto rounded-full object-cover`}
          src={profileImage}
          alt={username}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`${sizeClasses} mx-auto rounded-full bg-orange-500 flex items-center justify-center text-white ${textSizeClasses} font-medium`}>
          {getInitials(username)}
        </div>
      )}
    </div>
  );
} 