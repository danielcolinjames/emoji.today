"use client";
import Emoji, { useEmojiColor } from "@/components/Emoji";
import { getEmojiImageUrl } from "@/lib/emojis";
import { useSelectedEmoji } from "@/providers/SelectedEmojiProvider";
import Head from "next/head";
import { getRandomEmojis } from "@/lib/emojis";
import { useEffect, useMemo, useState } from "react";
// import RandomEmojis from "./components/RandomEmojis";

// const exampleEmojis = ['😂', '🚀', '🎁', '🦋', '🇺🇸', '🌭', '🎄', '🌈', '🗽', '🔥', '🦒', '💃', '🫧', '💘', '🐸', '🛻', '🫥']

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

  const [emojisToDisplay, setEmojisToDisplay] = useState<string[]>(Array(17).fill(""));

  useEffect(() => {
    const exampleEmojis = getRandomEmojis(17)
    setEmojisToDisplay(exampleEmojis)
  }, [])

  const [faintEmojiToShow, setFaintEmojiToShow] = useState<string>("❔");

  useEffect(() => {
    // every 3 seconds, update one random slot of the emojis to a random emoji
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * emojisToDisplay.length);
      const newEmojis = [...emojisToDisplay];
      newEmojis[randomIndex] = getRandomEmojis(1)[0];
      setEmojisToDisplay(newEmojis);

    }, 750);
    return () => clearInterval(interval);
  }, [emojisToDisplay]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomFaintEmoji = getRandomEmojis(1)[0];
      setFaintEmojiToShow(randomFaintEmoji);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex h-full flex-col items-center overflow-hidden">
      <Head>
        <meta property="og:image" content="https://emoji.date/og.png" />
      </Head>
      {/* NavBar */}
      <div className="flex w-full flex-col px-8">
        <div className="relative flex w-full justify-center mt-10 md:mt-40 mb-5">
          <h1 className="text-center text-5xl font-normal tracking-tighter sm:text-6xl md:text-8xl">
            What emoji is today?
          </h1>
        </div>
      </div>
      <div className="relative flex xl:block">
        <div className="absolute inset-0 block bg-gradient-to-r from-[#050505] via-transparent to-[#050505] pointer-events-none" />
        <div className="flex items-center justify-center pt-10 xl:flex-row xl:flex-nowrap xl:overflow-hidden xl:whitespace-nowrap gap-5">
          {emojisToDisplay.map((emoji, index) => (
            <p
              key={index}
              className="inline-block rounded-full text-6xl hover:cursor-cell sm:text-8xl"
              onClick={() => setSelectedEmoji(emoji)}
            >
              {emoji}
            </p>
          ))}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 mt-10 md:mt-20">
        <div className="flex flex-col items-center justify-center gap-10 sm:gap-14">
          <p className="text-center text-3xl font-thin tracking-tighter sm:text-4xl md:text-5xl">
            One emoji will represent <span style={{ color: color?.accent || '#5c5c5c' }}>{today}</span> onchain, forever.
          </p>
          {/* <p className="rounded-full border-4 border-[#0a0a0a] bg-[#000] p-10 text-center text-7xl font-thin tracking-tighter sm:p-20 sm:text-9xl">
            {emoji}
          </p> */}
          <div className="block md:hidden">
            <Emoji emoji={selectedEmoji ?? faintEmojiToShow} size={100} />
          </div>
          <div className="hidden md:block">
            <Emoji emoji={selectedEmoji ?? faintEmojiToShow} size={150} />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-xs md:max-w-lg flex-col px-4 mt-14 gap-4">
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
