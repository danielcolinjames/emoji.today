import { supabase } from "./supabase"

export interface DatabaseEmoji {
  emoji: string
  name: string
  accent_color: string
  filename: string
  keywords: string[]
  category: string
}

/**
 * Get random emojis from the database with accent colors
 */
export async function getRandomEmojis(
  count: number = 1
): Promise<DatabaseEmoji[]> {
  try {
    const { data, error } = await supabase
      .from("emojis")
      .select("emoji, name, accent_color, filename, keywords, category")
      .not("accent_color", "is", null) // Only get emojis with accent colors
      .order("created_at", { ascending: false }) // Get a consistent order first
      .limit(1000) // Get a large pool to randomize from

    if (error) {
      console.error("Error fetching emojis from database:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Filter out any emojis with null accent_color (extra safety) and type properly
    const validEmojis = data.filter(
      (emoji): emoji is DatabaseEmoji => emoji.accent_color !== null
    )

    // Randomize the selection
    const shuffled = [...validEmojis].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  } catch (error) {
    console.error("Error in getRandomEmojis:", error)
    return []
  }
}

/**
 * Get a single random emoji from the database
 */
export async function getRandomEmoji(): Promise<DatabaseEmoji | null> {
  const emojis = await getRandomEmojis(1)
  return emojis.length > 0 ? emojis[0] : null
}

/**
 * Get emoji image URL using the database filename
 */
export function getEmojiImageUrl(filename: string): string {
  return `/emoji-assets/apple-160/${filename}`
}

/**
 * Search emojis in the database by keyword
 */
export async function searchEmojis(query: string): Promise<DatabaseEmoji[]> {
  try {
    const { data, error } = await supabase
      .from("emojis")
      .select("emoji, name, accent_color, filename, keywords, category")
      .or(`name.ilike.%${query}%, keywords.cs.{${query}}`)
      .not("accent_color", "is", null)
      .limit(50)

    if (error) {
      console.error("Error searching emojis:", error)
      return []
    }

    // Filter out any emojis with null accent_color and type properly
    const validEmojis = (data || []).filter(
      (emoji): emoji is DatabaseEmoji => emoji.accent_color !== null
    )

    return validEmojis
  } catch (error) {
    console.error("Error in searchEmojis:", error)
    return []
  }
}

/**
 * Get emojis by category from the database
 */
export async function getEmojisByCategory(
  category: string
): Promise<DatabaseEmoji[]> {
  try {
    const { data, error } = await supabase
      .from("emojis")
      .select("emoji, name, accent_color, filename, keywords, category")
      .eq("category", category)
      .not("accent_color", "is", null)
      .limit(100)

    if (error) {
      console.error("Error getting emojis by category:", error)
      return []
    }

    // Filter out any emojis with null accent_color and type properly
    const validEmojis = (data || []).filter(
      (emoji): emoji is DatabaseEmoji => emoji.accent_color !== null
    )

    return validEmojis
  } catch (error) {
    console.error("Error in getEmojisByCategory:", error)
    return []
  }
}

/**
 * Legacy function that returns just emoji characters (for compatibility)
 */
export function getRandomEmojisLegacy(count: number = 100): string[] {
  // This is a temporary fallback - we should migrate to async database calls
  return ["😀", "😃", "😄", "😁", "🙂", "😊", "😍", "🤔", "😎", "🤗"].slice(
    0,
    count
  )
}
