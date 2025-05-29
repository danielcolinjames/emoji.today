'use client'; // Error components must be Client Components

import Link from 'next/link';
import Image from 'next/image';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-white px-4 text-center">
      <div className="mb-8 pt-20">
        <Image
          src="/images/sad.svg"
          alt="Sad face"
          width={200}
          height={200}
        />
      </div>
      <h1 className="text-2xl font-bold">Something went wrong!</h1>
      {/* Render the error message in development for debugging */}
      {process.env.NODE_ENV === 'development' && error?.message && (
        <p className="text-sm text-red-400 mb-6">
          Error: {error.message}
        </p>
      )}
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center text-white border border-white font-medium transition-colors duration-150 ease-in-out group focus:outline-none px-6 py-3 rounded-full"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white border border-gray-400 font-medium transition-colors duration-150 ease-in-out group focus:outline-none px-6 py-3 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 transition-transform duration-150 ease-in-out group-hover:-translate-x-1"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>
    </div>
  );
} 