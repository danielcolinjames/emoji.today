// Simple ranking logic that both voting results and chyron should use
// Rule: Vote count first, then latest vote time as tiebreaker

interface VoteWithTimestamp {
  emoji: string
  created_at: string
}

interface SimpleEmojiRank {
  emoji: string
  count: number
  percentage: number
  rank: number
  latestVoteTime?: string
}

/**
 * Simple ranking function that follows the user's exact requirements:
 * 1. Vote count (higher wins)
 * 2. If same vote count, emoji with later votes wins (tiebreaker)
 */
export function buildSimpleRankings(
  voteCounts: Record<string, number>,
  totalVotes: number,
  voteTimingData: VoteWithTimestamp[],
  limit = 10
): SimpleEmojiRank[] {
  // Calculate latest vote time for each emoji (for tiebreaking)
  const latestVoteMap = new Map<string, string>()

  voteTimingData.forEach((vote) => {
    const currentLatest = latestVoteMap.get(vote.emoji)
    if (!currentLatest || vote.created_at > currentLatest) {
      latestVoteMap.set(vote.emoji, vote.created_at)
    }
  })

  // Convert to array and sort
  const rankings = Object.entries(voteCounts)
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: totalVotes ? Math.round((count / totalVotes) * 100) : 0,
      rank: 0, // Will be set after sorting
      latestVoteTime: latestVoteMap.get(emoji),
    }))
    .sort((a, b) => {
      // Primary: higher vote count first
      if (b.count !== a.count) {
        return b.count - a.count
      }

      // Tiebreaker: later vote time wins (if both have vote times)
      if (a.latestVoteTime && b.latestVoteTime) {
        return b.latestVoteTime.localeCompare(a.latestVoteTime)
      }

      // If only one has a vote time, that one wins
      if (a.latestVoteTime && !b.latestVoteTime) return -1
      if (!a.latestVoteTime && b.latestVoteTime) return 1

      // If neither has vote time, maintain order
      return 0
    })
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))

  return rankings
}
