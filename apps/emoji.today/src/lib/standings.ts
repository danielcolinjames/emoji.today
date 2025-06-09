import { Database } from "@/lib/supabase"

export interface TimingStanding {
  emoji: string
  count: number
  percentage: number
  averageTimestamp: number
}

/**
 * Given vote counts, total votes and per-vote timestamps, return an array
 * sorted with the same logic used in useLiveVotingResults / VotingResults:
 * 1. If average timestamp differs by >1 second, later (higher) average ranks higher.
 * 2. Otherwise sort by count desc.
 */
export function buildTimingRankedStandings(
  voteCounts: Record<string, number>,
  totalVotes: number,
  voteTimingData: { emoji: string; created_at: string }[],
  limit = 10
): TimingStanding[] {
  // avg timestamp per emoji (seconds since day start UTC)
  const avgMap = new Map<string, number>()

  if (voteTimingData.length) {
    const day = voteTimingData[0].created_at.split("T")[0]
    const dayStart = new Date(`${day}T00:00:00.000Z`).getTime()
    const groups: Record<string, number[]> = {}
    voteTimingData.forEach((v) => {
      ;(groups[v.emoji] ||= []).push(
        Math.floor((new Date(v.created_at).getTime() - dayStart) / 1000)
      )
    })
    Object.entries(groups).forEach(([emoji, arr]) => {
      avgMap.set(emoji, arr.reduce((s, n) => s + n, 0) / arr.length)
    })
  }

  const entries = Object.entries(voteCounts).sort(([, a], [, b]) => b - a)

  return entries
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: totalVotes ? Math.round((count / totalVotes) * 100) : 0,
      averageTimestamp: avgMap.get(emoji) || 0,
    }))
    .sort((a, b) => {
      // Primary: higher vote count first
      if (b.count !== a.count) return b.count - a.count

      // Tie-break: later average timestamp (higher means more recent votes on average)
      const diff = b.averageTimestamp - a.averageTimestamp
      if (diff !== 0) return diff

      return 0
    })
    .slice(0, limit)
}
