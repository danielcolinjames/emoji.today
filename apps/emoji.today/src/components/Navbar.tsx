import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  return (
    <header className="w-full py-4 md:py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-start max-w-5xl lg:max-w-6xl xl:max-w-7xl">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
            <Image
              src="/images/logo-white.svg"
              alt="emoji.today logo"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <span className="text-xl sm:text-2xl md:text-3xl font-normal tracking-tight group-hover:opacity-80 transition-opacity">
            <span className="text-white">emoji</span>
            <span className="text-gray-500">.today</span>
          </span>
        </Link>
        {/* Future Nav items can go here */}
      </div>
    </header>
  );
};

export default Navbar;
