import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-white px-4 text-center pt-24">
      <div className="mb-8">
        <Image
          src="/images/sad.svg"
          alt="Sad face"
          width={200}
          height={200}
        />
      </div>
      <h1 className="text-4xl font-bold mb-10">404</h1>
      <Link
        href="/"
        className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors duration-150 ease-in-out group focus:outline-none focus:ring-1 focus:ring-gray-600 rounded-md px-2 py-1"
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
        Go back
      </Link>
    </div>
  );
} 