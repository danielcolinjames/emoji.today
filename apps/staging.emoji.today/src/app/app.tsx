"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { APP_NAME } from "~/lib/constants";
import Emoji from "~/components/Emoji";

export default function App(
  { title }: { title?: string } = { title: APP_NAME }
) {
  const [clientMounted, setClientMounted] = useState(false);

  useEffect(() => {
    setClientMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-white bg-[#050505] min-h-screen overflow-y-hidden pt-4 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">

        {/* Top Text Block */}
        <div className="text-center w-full mb-8 md:mb-10 lg:mb-16">
          <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
            What emoji is today?
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-500 leading-tight font-light mt-4">
            Vote for the emoji that best represents today.
          </p>
        </div>

        {/* Animated Emoji Container */}
        <div className="relative flex items-center justify-center w-full mb-12" style={{ height: '250px' }}>
          {clientMounted && (
            <Emoji
              animate={true}
              containerSize={250}
              borderWidth={15}
            />
          )}
        </div>

        {/* CTA Button */}
        <Link href="/vote" className="inline-block">
          <button className="bg-brand-primary hover:bg-brand-500 text-white font-semibold py-4 px-8 rounded-lg text-xl transition-colors duration-200 animate-pulse-subtle">
            Start Voting
          </button>
        </Link>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-center w-full pt-10 md:pt-20 gap-4 md:gap-6 pb-8">
        <div className="flex space-x-4 sm:space-x-8 items-center">
          <a href="https://farcaster.xyz/emojitoday" target="_blank" rel="noopener noreferrer">
            <img src="/images/farcaster-white.svg" alt="Farcaster" className="h-[26px] sm:h-[42px] w-auto" />
          </a>
          <a href="https://x.com/emoji_today" target="_blank" rel="noopener noreferrer">
            <img src="/images/x-white.svg" alt="X" className="h-[24px] sm:h-[40px]" />
          </a>
        </div>
        <div className="text-lg sm:text-xl md:text-2xl text-neutral-500 font-light">
          One vote. Every day. Forever.
        </div>
      </footer>
    </div>
  );
}
