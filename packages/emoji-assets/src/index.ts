import emojiData from "../data/emoji-metadata.json"

export interface EmojiData {
  emoji: string
  codePoint: string
  filename: string
}

// Export the emoji metadata directly
// After running the full download script, this will contain ALL ~1,700 emojis
export const EMOJI_DATA: EmojiData[] = emojiData

// Export just the emoji characters for easy use
// This will be the COMPLETE set of emojis after the full download
export const POPULAR_EMOJIS: string[] = EMOJI_DATA.map((e) => e.emoji)

/**
 * Get the local image path for an emoji
 * This replaces the GitHub CDN URL with a local path
 */
export function getLocalEmojiImagePath(emoji: string): string | null {
  if (!emoji || emoji === "") {
    return null
  }

  const codePoints = Array.from(emoji).map((char) =>
    char.codePointAt(0)!.toString(16).padStart(4, "0")
  )
  const emojiCode = codePoints.join("-")

  // Return path relative to the package
  return `/emoji-assets/apple-160/${emojiCode}.png`
}

/**
 * Get emoji data by emoji character
 */
export function getEmojiData(emoji: string): EmojiData | undefined {
  return EMOJI_DATA.find((e) => e.emoji === emoji)
}

/**
 * Get random emojis from our curated list
 */
export function getRandomEmojis(count: number = 1): string[] {
  const shuffled = [...POPULAR_EMOJIS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get emojis by category (to be implemented with categories)
 */
export function getEmojisByCategory(category: string): string[] {
  // TODO: Implement category filtering once we add category data
  return POPULAR_EMOJIS
}

/**
 * Search emojis by keyword (to be implemented)
 */
export function searchEmojis(query: string): string[] {
  // TODO: Implement search functionality
  return POPULAR_EMOJIS
}
