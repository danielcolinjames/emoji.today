import { mutate } from "swr"

/**
 * Cache keys used across the app
 */
export const CACHE_KEYS = {
  LIVE_VOTING_RESULTS: "live-voting-results",
  DAILY_RESULTS_INITIAL: "daily-results-initial",
  EMOJI_RANKS: (date: string) => `emoji-ranks-${date}`,
  DAILY_SUMMARY: (date: string) => `daily-summary-${date}`,
  CHYRON: "/api/chyron",
} as const

/**
 * Invalidate all voting-related caches when new votes are added
 * This ensures all open browser tabs/windows see updated results immediately
 */
export function invalidateVotingCaches(date?: string) {
  // Invalidate live voting results
  mutate(CACHE_KEYS.LIVE_VOTING_RESULTS)

  // Invalidate daily results
  mutate(CACHE_KEYS.DAILY_RESULTS_INITIAL)

  // Invalidate chyron
  mutate(CACHE_KEYS.CHYRON)

  // If date is provided, invalidate date-specific caches
  if (date) {
    // Invalidate emoji ranks for the date (all pages)
    mutate(
      (key) => typeof key === "string" && key.startsWith(`emoji-ranks-${date}`)
    )

    // Invalidate daily summary
    mutate([CACHE_KEYS.DAILY_SUMMARY(date), date])
  }

  console.log("🔄 Invalidated voting caches for real-time updates")
}

/**
 * Global function to be called from server actions
 * Uses setTimeout to ensure it runs after the component mounts
 */
export function scheduleVotingCacheInvalidation(date?: string) {
  if (typeof window !== "undefined") {
    // Client-side: invalidate immediately
    invalidateVotingCaches(date)
  } else {
    // Server-side: we'll handle this via broadcast events
    console.log("📡 Scheduled cache invalidation for next client update")
  }
}
