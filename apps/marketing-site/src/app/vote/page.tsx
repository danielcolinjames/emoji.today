"use client"
import Emoji, { useEmojiColor } from "@/components/Emoji"
import { getEmojiImageUrl, getRandomEmojis } from "@/lib/emojis";
import { useSelectedEmoji } from "@/providers/SelectedEmojiProvider";
import { useMemo } from "react";
import { EmojiVoteButton } from "../components/EmojiVoteButton";

export default function Page() {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const { selectedEmoji, setSelectedEmoji, selectedEmojiColor } = useSelectedEmoji();

  const emojiUrl = getEmojiImageUrl(selectedEmoji ?? "");
  const { color } = useEmojiColor(emojiUrl ?? "");

  const randomEmojis = useMemo(() => getRandomEmojis(12), [])

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 mt-4 md:mt-10">
      <div className="flex flex-col items-center justify-center gap-10 sm:gap-14">
        <p className="text-center text-3xl font-thin tracking-tighter sm:text-4xl md:text-5xl px-4">
          One emoji will represent <span style={{ color: color?.accent || '#5c5c5c' }}>{today}</span> onchain, forever.
        </p>
        {/* <p className="rounded-full border-4 border-[#0a0a0a] bg-[#000] p-10 text-center text-7xl font-thin tracking-tighter sm:p-20 sm:text-9xl">
              {emoji}
            </p> */}
        <div className="block md:hidden">
          <Emoji emoji={selectedEmoji} size={100} />
        </div>
        <div className="hidden md:block">
          <Emoji emoji={selectedEmoji} size={150} />
        </div>
        <p className="text-center text-3xl font-thin tracking-tighter sm:text-4xl md:text-5xl">
          Which one should it be?
        </p>
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4 w-full max-w-[350px] mx-auto">
          {randomEmojis.map((emoji, index) => (
            <EmojiVoteButton key={`${emoji}-${index}`} emoji={emoji} onClick={() => setSelectedEmoji(emoji)} />
          ))}
        </div>
      </div>
    </div>
  )
}
