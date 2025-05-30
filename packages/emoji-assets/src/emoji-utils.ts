import { EMOJI_FILENAME_MAP } from "./filename-mapping"

/**
 * Normalize an emoji by trying different variations:
 * 1. As-is
 * 2. Without variation selector (FE0F)
 * 3. With variation selector (FE0F)
 */
export function normalizeEmoji(emoji: string): string {
  // Try as-is first
  if (EMOJI_FILENAME_MAP[emoji]) {
    return emoji
  }

  // Remove all variation selectors (FE0F and FE0E)
  const withoutVariation = emoji.replace(/[\uFE0F\uFE0E]/g, "")
  if (EMOJI_FILENAME_MAP[withoutVariation]) {
    return withoutVariation
  }

  // Add variation selector if not present
  const withVariation = emoji + "\uFE0F"
  if (EMOJI_FILENAME_MAP[withVariation]) {
    return withVariation
  }

  // If single character, try adding variation selector
  if (emoji.length === 1) {
    const singleWithVariation = emoji + "\uFE0F"
    if (EMOJI_FILENAME_MAP[singleWithVariation]) {
      return singleWithVariation
    }
  }

  // Return original if no match found
  return emoji
}

/**
 * Get emoji filename with normalization
 */
export function getEmojiFilenameNormalized(emoji: string): string | null {
  const normalized = normalizeEmoji(emoji)
  return EMOJI_FILENAME_MAP[normalized] || null
}

/**
 * Debug function to show all variations of an emoji
 */
export function debugEmojiVariations(emoji: string) {
  const variations = {
    original: emoji,
    withoutVariation: emoji.replace(/[\uFE0F\uFE0E]/g, ""),
    withVariation: emoji + "\uFE0F",
    charCodes: Array.from(emoji).map((c) =>
      c.charCodeAt(0).toString(16).toUpperCase()
    ),
  }

  return {
    ...variations,
    mappings: {
      original: EMOJI_FILENAME_MAP[variations.original],
      withoutVariation: EMOJI_FILENAME_MAP[variations.withoutVariation],
      withVariation: EMOJI_FILENAME_MAP[variations.withVariation],
    },
  }
}
