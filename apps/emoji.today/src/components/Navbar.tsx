import Link from "next/link";

export const Navbar = () => {
  return (
    // <div className="flex w-full flex-col min-h-[45px] sm:min-h-[50px] fixed bg-[#050505]/0 backdrop-blur-xl border-b border-[transparent] shadow-xl z-50">
    <div className="flex w-full flex-col min-h-[45px] sm:min-h-[50px] fixed border-b border-[transparent] z-50">
      <Link href="/" className="flex items-center justify-center md:justify-center gap-3 z-10 w-full text-sm fixed px-4 py-2">
        <img src="/assets/logo-simple-white.svg" alt="emoji" className="w-[32px] h-[32px]" style={{ mixBlendMode: "exclusion" }} />
        {/* <p className="text-xl hidden md:block" style={{ backdropFilter: "invert(100%)" }}>
          emoji
          <span className='text-[#E3A300]'>
            .
          </span>
          date
        </p> */}
      </Link>
    </div>
  );
};
