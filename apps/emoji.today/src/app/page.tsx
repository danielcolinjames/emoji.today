"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from "react";
import Emoji from '@/components/Emoji';
import { getRandomEmoji, type DatabaseEmoji } from "@/lib/emojis";

const FADE_DURATION_MS = 500;

export default function Home() {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiOpacity, setEmojiOpacity] = useState(0); // For emoji fade-in
  const [currentAnimatedEmoji, setCurrentAnimatedEmoji] = useState<DatabaseEmoji | null>(null);
  const [animatedItemSize, setAnimatedItemSize] = useState({ container: 350, border: 20 });
  const [mainLogoOpacity, setMainLogoOpacity] = useState(1); // For fading out the main logo
  const [isEmojiCycling, setIsEmojiCycling] = useState(false); // To start emoji cycling
  const [clientMounted, setClientMounted] = useState(false);
  const [emojiColor, setEmojiColor] = useState('#ff6b35'); // Default color for CTA button

  const loadRandomEmoji = async () => {
    try {
      const emoji = await getRandomEmoji();
      if (emoji) {
        setCurrentAnimatedEmoji(emoji);
        setEmojiColor(emoji.accent_color);
      }
    } catch (error) {
      console.error('Error loading random emoji:', error);
    }
  };

  useEffect(() => {
    setClientMounted(true);
    const initialWait = 300; // Time before emoji starts to appear
    const pauseBeforeFadeIn = 1000; // 1 second pause with 0% opacity

    // Phase 1: Emoji becomes present (0% opacity)
    const emojiPresentTimer = setTimeout(() => {
      loadRandomEmoji();
      setShowEmoji(true);    // Make Emoji component render
      setEmojiOpacity(0);    // Start at 0% opacity
    }, initialWait);

    // Phase 1b: Emoji starts fading in
    const emojiFadeInTimer = setTimeout(() => {
      setEmojiOpacity(1);    // Start fading in emoji (CSS transition will take fadeInDuration)
    }, initialWait + pauseBeforeFadeIn);

    // Phase 2: Main logo fades out (after emoji fade-in starts)
    const logoFadeOutTimer = setTimeout(() => {
      setMainLogoOpacity(0); // Main logo fades out
    }, initialWait + pauseBeforeFadeIn + FADE_DURATION_MS); // FADE_DURATION_MS is the visual fade of emoji

    // Phase 3: Emoji starts cycling (after logo is out)
    const cycleStartTimer = setTimeout(() => {
      setIsEmojiCycling(true);
    }, initialWait + pauseBeforeFadeIn + FADE_DURATION_MS + FADE_DURATION_MS); // Second FADE_DURATION_MS for logo fade

    return () => {
      clearTimeout(emojiPresentTimer);
      clearTimeout(emojiFadeInTimer);
      clearTimeout(logoFadeOutTimer);
      clearTimeout(cycleStartTimer);
    };
  }, []);

  // Cycle emojis from database
  useEffect(() => {
    if (isEmojiCycling) {
      const interval = setInterval(() => {
        loadRandomEmoji();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isEmojiCycling]);

  return (
    <div className="flex flex-col items-center justify-center text-white bg-[#050505] overflow-y-hidden pt-4 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Centered Top Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50">
        <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
          <Image src="/images/logo-white.svg" alt="emoji.today" width={48} height={48} />
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">

        {/* Top Text Block - Added more padding */}
        <div className="text-center w-full mb-12 md:mb-16 lg:mb-20 mt-16 md:mt-20 lg:mt-24">
          <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
            What emoji is today?
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-500 leading-tight font-light mt-4">
            Only one emoji can win. Every day. Forever.
          </p>
        </div>

        {/* Centered Emoji Container */}
        <div
          className="relative flex items-center justify-center w-full"
          style={{
            height: `${animatedItemSize.container}px`,
          }}
        >
          {/* Centered animated item container */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: `${animatedItemSize.container}px`,
              height: `${animatedItemSize.container}px`,
            }}
          >
            {/* 1. Persistent Main Logo (bottom layer, fades out) */}
            <div
              className="absolute inset-0 z-30"
              style={{
                opacity: mainLogoOpacity,
                transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
              }}
            >
              <Image
                src="/images/logo-white-with-solid-bg.svg"
                alt="emoji.today main logo"
                layout="fill"
                objectFit="contain"
                priority
              />
            </div>

            {/* 2. Emoji that fades in on top (top layer) */}
            {showEmoji && currentAnimatedEmoji && (
              <div
                className="absolute inset-0 z-40"
                style={{
                  opacity: emojiOpacity,
                  transition: `opacity 1000ms ease-in-out`, // Explicitly 1 second fade
                }}
              >
                <Emoji
                  emoji={currentAnimatedEmoji.emoji}
                  containerSize={animatedItemSize.container}
                  borderWidth={animatedItemSize.border}
                  accentColor={currentAnimatedEmoji.accent_color}
                />
              </div>
            )}
          </div>
        </div>

        {/* CTA Button - Made wider, more padding, rounded-full */}
        <div className="mt-16 md:mt-20 lg:mt-24 mb-12">
          <Link href="/vote" className="inline-block">
            <button
              className="py-5 px-12 rounded-full text-2xl transition-all duration-300 min-w-[200px]"
              style={{
                backgroundColor: emojiColor,
                color: 'white'
              }}
            >
              Vote now
            </button>
          </Link>
        </div>
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
