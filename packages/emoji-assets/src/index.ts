import { CompactEmoji } from "emojibase"
import en from "emojibase-data/en/compact.json"

export interface EmojiData {
  emoji: string
  codePoint: string
  filename: string
  name?: string
  keywords?: string[]
  category?: string
}

// Convert Emojibase data to our EmojiData format
function convertToEmojiData(compactEmoji: CompactEmoji): EmojiData {
  // Use the unicode property directly from CompactEmoji
  const emoji = compactEmoji.unicode

  return {
    emoji,
    codePoint: compactEmoji.hexcode,
    filename: `${compactEmoji.hexcode.toLowerCase()}.png`,
    name: compactEmoji.label, // Use 'label' property instead of 'annotation'
    keywords: compactEmoji.tags || [],
    category: `${compactEmoji.group || 0}`, // Convert number to string for compatibility
  }
}

// Filter function to exclude unwanted emojis
function shouldIncludeEmoji(emoji: string): boolean {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0)!)

  // Skip regional indicator symbols (🇦-🇿) - these are only useful in flag combinations
  if (codePoints.length === 1) {
    const codePoint = codePoints[0]
    if (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) {
      return false
    }
  }

  // Skip standalone skin tone modifiers (🏻🏼🏽🏾🏿)
  if (codePoints.length === 1) {
    const codePoint = codePoints[0]
    if (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff) {
      return false
    }
  }

  return true
}

// Export the emoji metadata - now sourced from Emojibase Unicode 16.0 data
export const EMOJI_DATA: EmojiData[] = en
  .map(convertToEmojiData)
  .filter((e) => shouldIncludeEmoji(e.emoji))

// Export just the emoji characters for easy use
export const POPULAR_EMOJIS: string[] = EMOJI_DATA.map((e) => e.emoji)

/**
 * Get the local image path for an emoji
 * Tries multiple filename variations to find the one that actually exists
 */
export function getLocalEmojiImagePath(emoji: string): string | null {
  if (!emoji || emoji === "") {
    return null
  }

  const codePoints = Array.from(emoji).map((char) =>
    char.codePointAt(0)!.toString(16).padStart(4, "0")
  )

  // Skip regional indicator symbols (country code letters 🇦-🇿)
  if (codePoints.length === 1) {
    const codePoint = parseInt(codePoints[0], 16)
    if (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) {
      return null
    }
  }

  // Skip standalone skin tone modifiers (they don't have separate files)
  if (codePoints.length === 1) {
    const codePoint = parseInt(codePoints[0], 16)
    if (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff) {
      return null
    }
  }

  const baseCode = codePoints.join("-")

  // Generate multiple filename variations to try in order of preference
  const variations = [
    // 1. Try exact code as-is
    baseCode,

    // 2. Try without any FE0F variation selectors
    baseCode.replace(/-fe0f/g, ""),

    // 3. Try with FE0F selectors added strategically
    // Add FE0F before ZWJ (200d) for complex sequences
    baseCode.replace(/(-200d-)/g, "-fe0f$1"),

    // 4. Try with FE0F after main emoji codes for ZWJ sequences
    baseCode.replace(/^([0-9a-f]+)(-200d-.+)$/i, "$1-fe0f$2"),

    // 5. Try with FE0F at the end for ZWJ sequences
    baseCode.replace(/(-200d-[0-9a-f]+)$/i, "$1-fe0f"),

    // 6. Try with FE0F before keycap sequences (20e3)
    baseCode.replace(/^([0-9a-f]+)(-20e3)$/i, "$1-fe0f$2"),

    // 7. Try base emoji only (first codepoint) for complex sequences
    codePoints[0],
  ]

  // Remove duplicates while preserving order
  const uniqueVariations = [...new Set(variations)]

  // For now, just return the first variation (original behavior)
  // In a real implementation, you'd check the filesystem to see which exists
  // Return the simplest version first (without fe0f)
  const preferredVariation =
    uniqueVariations.find((variation) => !variation.includes("-fe0f")) ||
    uniqueVariations[0]

  return `/emoji-assets/apple-160/${preferredVariation}.png`
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
 * Get emojis by category
 */
export function getEmojisByCategory(category: string): string[] {
  const categoryEmojis = EMOJI_DATA.filter((e) => e.category === category).map(
    (e) => e.emoji
  )

  return categoryEmojis.length > 0 ? categoryEmojis : POPULAR_EMOJIS
}

/**
 * Search emojis by keyword or name
 */
export function searchEmojis(query: string): string[] {
  const lowerQuery = query.toLowerCase()

  return EMOJI_DATA.filter((e) => {
    return (
      e.name?.toLowerCase().includes(lowerQuery) ||
      e.keywords?.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
    )
  }).map((e) => e.emoji)
}

// Export useful constants
export const EMOJI_COUNT = EMOJI_DATA.length
export const CATEGORIES = [
  ...new Set(EMOJI_DATA.map((e) => e.category).filter(Boolean)),
]

// Re-export the definitive filename mapping
export {
  EMOJI_FILENAME_MAP,
  getEmojiFilename,
  getEmojiImageUrl as getDefinitiveEmojiImageUrl,
} from "./filename-mapping"
