"use client";
import Emoji, { useEmojiColor } from "@/components/Emoji";
import { getEmojiImageUrl } from "@/lib/emojis";
import { useSelectedEmoji } from "@/providers/SelectedEmojiProvider";
import Head from "next/head";
import { getRandomEmojis } from "@/lib/emojis";
import { useEffect, useMemo, useState } from "react";
// import RandomEmojis from "./components/RandomEmojis";

// const exampleEmojis = ['😂', '🚀', '🎁', '🦋', '🇺🇸', '🌭', '🎄', '🌈', '🗽', '🔥', '🦒', '💃', '🫧', '💘', '🐸', '🛻', '🫥']

// Initial emoji for the right side animation
const INITIAL_RIGHT_EMOJI = "🙂";

export default function Home() {
  const { selectedEmoji, setSelectedEmoji, selectedEmojiColor } = useSelectedEmoji();

  // const [emoji, setEmoji] = useState(null)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setEmoji(getRandomEmoji())
  //   }, 500)

  //   return () => clearInterval(interval)
  // }, [])
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const handleEmojiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // const lastChar = input.slice(-1);

    // if (isEmoji(lastChar)) {
    setSelectedEmoji(input);
    // } else if (input.length === 0) {
    // setSelectedEmoji(null);
    // }
  };

  // State for the animated emoji on the right
  const [currentRightEmoji, setCurrentRightEmoji] = useState<string>(INITIAL_RIGHT_EMOJI);
  const [startAnimation, setStartAnimation] = useState<boolean>(false);
  const [emojiOpacity, setEmojiOpacity] = useState<number>(1);

  // Effect to trigger animation start and fade out initial emoji
  useEffect(() => {
    const initialDisplayTimer = setTimeout(() => {
      setEmojiOpacity(0); // Start fade out
      const animationStartTimer = setTimeout(() => {
        setStartAnimation(true);
        setCurrentRightEmoji(getRandomEmojis(1)[0]); // Set first random emoji
        setEmojiOpacity(1); // Fade in
      }, 1000); // Wait for fade out to complete (1s)

      return () => clearTimeout(animationStartTimer);
    }, 4000); // Display initial emoji for 4s

    return () => clearTimeout(initialDisplayTimer);
  }, []);

  // Effect for continuous random emoji animation
  useEffect(() => {
    if (startAnimation) {
      const interval = setInterval(() => {
        // Consider adding a fade transition here if desired, for now, direct change
        setCurrentRightEmoji(getRandomEmojis(1)[0]);
      }, 1500); // Change emoji every 1.5 seconds
      return () => clearInterval(interval);
    }
  }, [startAnimation]);

  const emojiUrl = getEmojiImageUrl(selectedEmoji ?? "");
  const { color } = useEmojiColor(emojiUrl ?? "");

  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      const newTimer = setTimeout(() => {
        setSelectedEmoji(null);
      }, 60000); // 60 seconds
      setInactivityTimer(newTimer);
    };

    resetInactivityTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [selectedEmoji]);

  useEffect(() => {
    const handleUserActivity = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      const newTimer = setTimeout(() => {
        setSelectedEmoji(null);
      }, 5 * 1000); // 5 seconds
      setInactivityTimer(newTimer);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimer]);

  return (
    <div className="flex h-full flex-col items-center overflow-hidden text-white">
      <Head>
        <meta property="og:image" content="https://emoji.today/og.png" />
        {/* Ensure emoji.today is used if og.png isn't the final one, or update this path */}
      </Head>

      {/* New Top Section */}
      <div className="flex flex-col items-center justify-center w-full py-10 md:py-12 lg:py-16 xl:py-20 min-h-[60vh] md:min-h-[70vh]">
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4">
          {/* Left Text Block */}
          <div className="text-center md:text-left mb-10 md:mb-0 md:w-3/5 lg:w-1/2">
            <h1 className="text-5xl font-normal tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl xl:text-[90px] leading-tight">
              Launching Friday.
            </h1>
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[64px] text-gray-400 mt-2 md:mt-3 leading-tight">
              And Saturday.
            </p>
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[64px] text-gray-400 leading-tight">
              And every day after that.
            </p>
          </div>

          {/* Right Animated Emoji Block */}
          <div className="md:w-2/5 lg:w-1/2 flex justify-center md:justify-end items-center mt-8 md:mt-0">
            <div style={{ opacity: emojiOpacity, transition: 'opacity 1s ease-in-out' }}>
              <Emoji emoji={currentRightEmoji} size={180} /> {/* Increased size slightly */}
            </div>
          </div>
        </div>

        {/* "emoji.today" text below the main content */}
        <div className="mt-10 md:mt-12 lg:mt-16">
          <p className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight">
            <span className="text-white">emoji</span><span className="text-gray-500">.today</span>
          </p>
        </div>
      </div>

      {/* Existing content moved below */}
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 mt-10 md:mt-12 pb-20">
        <div className="flex flex-col items-center justify-center gap-10 sm:gap-14">
          <p className="text-center text-3xl font-thin tracking-tighter sm:text-4xl md:text-5xl">
            One emoji will represent <span style={{ color: color?.accent || '#5c5c5c' }}>{today}</span> onchain, forever.
          </p>
          {/* The central selected/faint emoji display is removed as per new design focus on right emoji */}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-xs md:max-w-lg flex-col px-4 mt-0 md:mt-2 gap-4 pb-10">
        <p className="text-center text-3xl font-thin tracking-tighter sm:text-4xl md:text-5xl">
          Which one should it be?
        </p>
        <input
          type="text"
          className="text-3xl md:text-5xl w-full bg-[#000] border-4 p-3 md:p-4 rounded-full focus:outline-none outline-none focus:ring-0 focus:border-4 duration-200 transition-all text-center"
          value={selectedEmoji || ""}
          style={{
            '--focus-color': color?.accent ?? '#454545',
            borderColor: 'var(--focus-color)',
          } as React.CSSProperties}
          onChange={handleEmojiInputChange}
        />
      </div>
    </div>
  )
} 