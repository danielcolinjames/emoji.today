"use client";

import Image from 'next/image';
import { useEffect, useState } from "react";
import Emoji from '@/components/Emoji';
import { getRandomEmojis, type DatabaseEmoji } from "@/lib/emojis";

const FADE_DURATION_MS = 500;
const MAX_ECHOES = 30;
const MAX_ECHO_OPACITY = 0.5;
const MIN_ECHO_OPACITY = 0.0; // Last echo will be 0% opacity

export default function OldHomePage() {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiOpacity, setEmojiOpacity] = useState(0); // For emoji fade-in
  const [currentAnimatedEmoji, setCurrentAnimatedEmoji] = useState<DatabaseEmoji | null>(null);
  const [animatedItemSize, setAnimatedItemSize] = useState({ container: 250, border: 15 });
  const [echoCount, setEchoCount] = useState(MAX_ECHOES);
  const [mainLogoOpacity, setMainLogoOpacity] = useState(1); // For fading out the main logo
  const [isEmojiCycling, setIsEmojiCycling] = useState(false); // To start emoji cycling
  const [clientMounted, setClientMounted] = useState(false);

  const loadRandomEmoji = async () => {
    try {
      const emojis = await getRandomEmojis(1);
      if (emojis.length > 0) {
        setCurrentAnimatedEmoji(emojis[0]);
      }
    } catch (error) {
      console.error('Error loading random emoji:', error);
    }
  };

  useEffect(() => {
    setClientMounted(true);
    const initialWait = 4500; // Time before emoji starts to appear
    const pauseBeforeFadeIn = 1000; // 1 second pause with 0% opacity

    // Phase 1: Emoji becomes present (0% opacity)
    const emojiPresentTimer = setTimeout(async () => {
      await loadRandomEmoji();
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

  // Cycle emojis when cycling is enabled
  useEffect(() => {
    if (isEmojiCycling) {
      const interval = setInterval(() => {
        loadRandomEmoji();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isEmojiCycling]);

  const negativeOffsetPx = -30; // This is used for horizontal offset

  return (
    <div className="text-white bg-[#050505] overflow-y-hidden pt-16 sm:pt-24 md:pt-28 lg:pt-32">
      {/* Main Content Area - positioned at fixed distance from top */}
      <main className="w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">

        {/* Top Text Block */}
        <div className="text-center w-full mb-8 md:mb-10 lg:mb-16">
          <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
            Launching today.
          </h1>
          <p className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-neutral-500 leading-tight font-light">
            And tomorrow.
          </p>
          <p className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-neutral-500 leading-tight font-light">
            And every day after that.
          </p>
        </div>

        {/* Container for the rightmost item and its echoes - Reverted to original */}
        <div
          className="relative flex items-center justify-center w-full"
          style={{
            height: `${animatedItemSize.container}px`,
          }}
        >
          {/* Rightmost animated item container */}
          <div
            className="absolute right-0"
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
                  filename={currentAnimatedEmoji.filename}
                  containerSize={animatedItemSize.container}
                  borderWidth={animatedItemSize.border}
                  accentColor={currentAnimatedEmoji.accent_color}
                />
              </div>
            )}
          </div>

          {/* Echoes Container */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              width: '100%',
              height: `${animatedItemSize.container}px`,
              zIndex: 20,
            }}
          >
            {clientMounted && Array.from({ length: echoCount }).map((_, i) => {
              let opacity;
              if (echoCount <= 1) {
                opacity = (echoCount === 1) ? MAX_ECHO_OPACITY : MIN_ECHO_OPACITY;
              } else {
                const progress = i / (echoCount - 1);
                opacity = MIN_ECHO_OPACITY + (MAX_ECHO_OPACITY - MIN_ECHO_OPACITY) * Math.pow(1 - progress, 3);
              }
              opacity = Math.max(MIN_ECHO_OPACITY, Math.min(MAX_ECHO_OPACITY, opacity));
              if (i === 0 && echoCount > 0) {
                opacity = MAX_ECHO_OPACITY;
              }

              const rightPosition = (i + 1) * Math.abs(negativeOffsetPx);

              return (
                <div
                  key={`echo-${i}`}
                  className="absolute"
                  style={{
                    right: `${rightPosition}px`,
                    opacity: opacity,
                    zIndex: echoCount - i,
                    width: `${animatedItemSize.container}px`,
                    height: `${animatedItemSize.container}px`,
                  }}
                >
                  <Image
                    src="/images/logo-white-with-solid-bg.svg"
                    alt={`emoji.today logo echo ${i + 1}`}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer with proper spacing */}
      <footer className="flex flex-col items-center justify-center w-full pt-10 md:pt-20 gap-4 md:gap-6 pb-10 sm:pb-24">
        <div className="flex space-x-4 sm:space-x-8 items-center">
          <a href="https://farcaster.xyz/emojitoday" target="_blank" rel="noopener noreferrer">
            <img src="/images/farcaster-white.svg" alt="Farcaster" className="h-[26px] sm:h-[42px] w-auto" />
          </a>
          <a href="https://x.com/emoji_today" target="_blank" rel="noopener noreferrer">
            <img src="/images/x-white.svg" alt="X" className="h-[24px] sm:h-[40px]" />
          </a>
        </div>
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-500 font-light">Notifications on.</div>
      </footer>
    </div>
  );
}
