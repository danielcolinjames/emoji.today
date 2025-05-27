import Emoji, { useEmojiColor } from "@/components/Emoji"
import { getEmojiImageUrl } from "@/lib/emojis"

export const EmojiVoteButton = ({ emoji, onClick }: { emoji: string, onClick: (emoji: string) => void }) => {
  const emojiUrl = getEmojiImageUrl(emoji)
  const { color } = useEmojiColor(emojiUrl) ?? '#5c5c5c'

  return (
    <button onClick={() => onClick(emoji)} className="flex flex-grow items-center justify-center w-full px-2 py-1 rounded-full border-2 bg-[#000] focus:bg-[#111]" style={{ borderColor: color?.accent || '#5c5c5c' }}>
      <Emoji hideBg hideBorder emoji={emoji} size={24} />
      {/* <p className="text-sm text-center" style={{ color: color?.accent || '#5c5c5c' }}>{count}</p> */}
    </button>
  )
}