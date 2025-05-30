"use client";

import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 48, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin">
        <Image
          src="/images/logo-white.svg"
          alt="Loading..."
          width={size}
          height={size}
          className="opacity-80"
        />
      </div>
    </div>
  );
} 