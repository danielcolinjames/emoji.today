"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from "react";
import { useSession, getCsrfToken, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import sdk, { SignIn as SignInCore } from "@farcaster/frame-sdk";
import Emoji from '@/components/Emoji';
import { VotingCountdown } from '@/components/VotingCountdown';
import { getRandomEmoji, type DatabaseEmoji } from "@/lib/emojis";
import { getContrastTextColor } from "@/lib/utils";
import { useFrame } from "@/components/providers/FrameProvider";
import { getVotingResults } from "@/lib/actions";

const FADE_DURATION_MS = 500;

export default function Home() {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiOpacity, setEmojiOpacity] = useState(0); // For emoji fade-in
  const [currentAnimatedEmoji, setCurrentAnimatedEmoji] = useState<DatabaseEmoji | null>(null);
  const [animatedItemSize, setAnimatedItemSize] = useState({ container: 300, border: 18 });
  const [mainLogoOpacity, setMainLogoOpacity] = useState(1); // For fading out the main logo
  const [isEmojiCycling, setIsEmojiCycling] = useState(false); // To start emoji cycling
  const [clientMounted, setClientMounted] = useState(false);
  const [emojiColor, setEmojiColor] = useState('#FFFFFF'); // Default color for CTA button
  const [textColor, setTextColor] = useState<'black' | 'white'>('black'); // Text color for button - start with black
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCheckingVote, setIsCheckingVote] = useState(false);

  const { data: session, status } = useSession();
  const { context } = useFrame();
  const router = useRouter();

  const loadRandomEmoji = async (updateColorsImmediately = false) => {
    try {
      const emoji = await getRandomEmoji();
      if (emoji) {
        setCurrentAnimatedEmoji(emoji);
        if (updateColorsImmediately) {
          updateButtonColors(emoji);
        }
      }
      return emoji;
    } catch (error) {
      console.error('Error loading random emoji:', error);
      return null;
    }
  };

  const updateButtonColors = (emoji: DatabaseEmoji) => {
    setEmojiColor(emoji.accent_color);
    setTextColor(getContrastTextColor(emoji.accent_color));
  };

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!context) {
      // Not in Farcaster, open in Farcaster
      window.open("https://warpcast.com/~/add/emoji.today", "_blank");
      return;
    }

    try {
      setIsSigningIn(true);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });

      // After successful sign in, redirect to vote page
      router.push('/vote');
    } catch (e) {
      console.error('Sign in error:', e);
    } finally {
      setIsSigningIn(false);
    }
  }, [getNonce, context, router]);

  // Check if user has voted today (only when authenticated)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.fid) {
      checkVotingStatus();
    } else if (status === "unauthenticated") {
      // Reset voting status when user logs out
      setHasVoted(false);
      setIsCheckingVote(false);
    }
  }, [status, session]);

  const checkVotingStatus = async () => {
    // Double-check authentication before making the API call
    if (status !== "authenticated" || !session?.user?.fid) {
      setHasVoted(false);
      setIsCheckingVote(false);
      return;
    }

    try {
      setIsCheckingVote(true);
      const data = await getVotingResults();
      setHasVoted(!!data); // If data exists, user has voted
    } catch (error) {
      // Handle authentication errors gracefully (e.g., during logout)
      if (error instanceof Error && error.message.includes('Authentication required')) {
        console.log('User logged out during voting status check');
        setHasVoted(false);
        return;
      }
      console.error('Error checking voting status:', error);
      setHasVoted(false);
    } finally {
      setIsCheckingVote(false);
    }
  };

  useEffect(() => {
    setClientMounted(true);
    const initialWait = 2000; // Time before emoji starts to appear
    const pauseBeforeFadeIn = 1000; // 1 second pause with 0% opacity

    let loadedEmoji: DatabaseEmoji | null = null;

    // Phase 1: Emoji becomes present (0% opacity)
    const emojiPresentTimer = setTimeout(async () => {
      loadedEmoji = await loadRandomEmoji();
      setShowEmoji(true);    // Make Emoji component render
      setEmojiOpacity(0);    // Start at 0% opacity
    }, initialWait);

    // Phase 1b: Emoji starts fading in
    const emojiFadeInTimer = setTimeout(() => {
      setEmojiOpacity(1);    // Start fading in emoji (CSS transition will take fadeInDuration)
    }, initialWait + pauseBeforeFadeIn);

    // Phase 1c: Button colors change when emoji is partially visible (halfway through fade)
    const buttonColorTimer = setTimeout(() => {
      if (loadedEmoji) {
        updateButtonColors(loadedEmoji);
      }
    }, initialWait + pauseBeforeFadeIn + 500); // 500ms into the 1000ms emoji fade

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
      clearTimeout(buttonColorTimer);
      clearTimeout(logoFadeOutTimer);
      clearTimeout(cycleStartTimer);
    };
  }, []);

  // Cycle emojis from database
  useEffect(() => {
    if (isEmojiCycling) {
      const interval = setInterval(() => {
        loadRandomEmoji(true); // Update colors immediately when cycling
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isEmojiCycling]);

  const getButtonText = () => {
    if (status === "authenticated") {
      return hasVoted ? "View voting results" : "Cast your vote";
    } else if (context) {
      return "Sign in to vote";
    }
    return "Vote in Farcaster";
  };

  const handleButtonClick = () => {
    if (status === "authenticated") {
      // If already authenticated, just navigate to vote page
      router.push('/vote');
    } else {
      // If not authenticated, handle sign in
      handleSignIn();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-white bg-[#050505] pt-4 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">

        {/* Top Text Block - Updated with new title and subtitle */}
        <div className="text-center w-full mb-8 md:mb-10 lg:mb-20 mt-12 md:mt-20 lg:mt-24 flex flex-col">
          <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
            What emoji is today?
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-neutral-400 leading-tight font-light">
            Let's make May 29, 2025 iconic.
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
                  filename={currentAnimatedEmoji.filename}
                  containerSize={animatedItemSize.container}
                  borderWidth={animatedItemSize.border}
                  accentColor={currentAnimatedEmoji.accent_color}
                />
              </div>
            )}
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mt-8 md:mt-12 lg:mt-16 mb-2 sm:mb-4">
          <VotingCountdown />
        </div>

        {/* CTA Button - Updated with authentication and dynamic text */}
        <div className="mb-4 sm:mb-12">
          <button
            onClick={handleButtonClick}
            disabled={isSigningIn}
            className="flex items-center justify-center py-4 px-8 sm:py-5 sm:px-12 rounded-full text-2xl transition-all duration-300 w-full cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: emojiColor,
              color: textColor,
              transition: 'background-color 300ms ease-in-out, color 300ms ease-in-out'
            }}
          >
            {isSigningIn ? (
              <Image
                src="/images/logo-white.svg"
                alt="Loading"
                width={24}
                height={24}
                className="animate-spin"
                style={{
                  filter: textColor === 'black' ? 'invert(1)' : 'none'
                }}
              />
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src="/images/farcaster-white.svg"
                  alt="Farcaster"
                  className="h-4 w-4 sm:h-6 sm:w-6"
                  style={{
                    filter: textColor === 'black' ? 'invert(1)' : 'none'
                  }}
                />
                <p className="text-base sm:text-lg md:text-xl text-center">
                  {getButtonText()}
                </p>
              </div>
            )}
          </button>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 font-geist-mono mt-2 sm:mt-4 text-center max-w-[380px] mx-auto">
            Today&apos;s legacy is on the line.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-center w-full pt-4 md:pt-20 gap-4 md:gap-6 pb-2 sm:pb-4">
        <div className="flex space-x-4 sm:space-x-8 items-center">
          <a href="https://farcaster.xyz/emojitoday" target="_blank" rel="noopener noreferrer">
            <img src="/images/farcaster-white.svg" alt="Farcaster" className="h-[26px] sm:h-[42px] w-auto" />
          </a>
          <a href="https://x.com/emoji_today" target="_blank" rel="noopener noreferrer">
            <img src="/images/x-white.svg" alt="X" className="h-[24px] sm:h-[40px]" />
          </a>
        </div>
      </footer>
    </div>
  );
}