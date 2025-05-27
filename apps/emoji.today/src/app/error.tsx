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
    <div className="flex flex-col items-center justify-center text-white px-4 text-center py-10 min-h-[calc(100vh-100px)]">
      <div className="mb-8">
        <Image
          src="/images/sad.svg"
          alt="Sad face"
          width={200}
          height={200}
        />
      </div>
      <h1 className="text-6xl font-bold mb-6">Oops, something went wrong!</h1>
      <p className="text-xl text-gray-400 mb-10">
        We encountered an unexpected error. Please try again or go back to the homepage.
      </p>
      {/* Render the error message in development for debugging */}
      {process.env.NODE_ENV === 'development' && error?.message && (
        <p className="text-sm text-red-400 mb-6">
          Error: {error.message}
        </p>
      )}
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors duration-150 ease-in-out group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-6 py-3"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors duration-150 ease-in-out group focus:outline-none focus:ring-1 focus:ring-gray-600 rounded-md px-6 py-3"
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
          Go to Homepage
        </Link>
      </div>
    </div>
  );
} 