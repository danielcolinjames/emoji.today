"use client";

import Head from "next/head";
import Image from 'next/image';
import { useEffect, useState } from "react";
import Emoji from '@/components/Emoji';
import { getRandomEmojis } from "@/lib/emojis";

const FADE_DURATION_MS = 500;
const MAX_ECHOES = 30;
const MIN_ECHOES = 10;
const MAX_ECHO_OPACITY = 0.5;
const MIN_ECHO_OPACITY = 0.0; // Last echo will be 0% opacity

export default function Home() {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiOpacity, setEmojiOpacity] = useState(0); // For emoji fade-in
  const [currentAnimatedEmoji, setCurrentAnimatedEmoji] = useState<string>("");
  const [animatedItemSize, setAnimatedItemSize] = useState({ container: 300, border: 18 });
  const [echoCount, setEchoCount] = useState(MAX_ECHOES);
  const [mainLogoOpacity, setMainLogoOpacity] = useState(1); // For fading out the main logo
  const [isEmojiCycling, setIsEmojiCycling] = useState(false); // To start emoji cycling

  useEffect(() => {
    const initialWait = 4500; // Time before emoji starts to appear
    const pauseBeforeFadeIn = 1000; // 1 second pause with 0% opacity

    // Phase 1: Emoji becomes present (0% opacity)
    const emojiPresentTimer = setTimeout(() => {
      setCurrentAnimatedEmoji(getRandomEmojis(1)[0]);
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

  const negativeOffsetPx = -30; // This is used for horizontal offset

  return (
    <div className="flex flex-col items-center justify-center text-white bg-[#050505] overflow-y-hidden">
      <Head>
        <meta property="og:image" content="https://emoji.today/og.png" />
      </Head>

      {/* Navbar is now rendered by layout.tsx */}

      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">

        {/* Top Text Block */}
        <div className="text-center w-full mb-12 md:mb-16 lg:mb-20">
          <h1 className="text-4xl font-normal tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
            Launching Friday.
          </h1>
          <p className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-[64px] text-gray-400 mt-2 md:mt-3 leading-tight">
            And Saturday.
          </p>
          <p className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-[64px] text-gray-400 leading-tight">
            And every day after that.
          </p>
        </div>

        {/* Container for the rightmost item and its echoes - Reverted to original */}
        <div
          className="relative flex items-center justify-center w-full"
          style={{
            height: `${animatedItemSize.container}px`,
            // Removed flexDirection, alignItems, justifyContent specific to mobile column
          }}
        >

          {/* Rightmost animated item container - Reverted to original */}
          <div
            className="absolute right-0" // Reverted from "relative"
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
            {showEmoji && (
              <div
                className="absolute inset-0 z-40"
                style={{
                  opacity: emojiOpacity,
                  transition: `opacity 1000ms ease-in-out`, // Explicitly 1 second fade
                }}
              >
                <Emoji
                  emoji={currentAnimatedEmoji}
                  containerSize={animatedItemSize.container}
                  borderWidth={animatedItemSize.border}
                  animate={isEmojiCycling} // Controlled by new state
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
            {Array.from({ length: echoCount }).map((_, i) => {
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
    </div>
  );
}
