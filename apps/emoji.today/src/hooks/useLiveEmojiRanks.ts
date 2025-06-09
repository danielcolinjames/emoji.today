import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { supabase } from "@/lib/supabase"
import { buildSimpleRankings } from "@/lib/simple-ranking"

const PAGE_SIZE = 10

interface LiveEmojiRank {
  id: string
  vote_date: string
  emoji: string
  vote_count: number
  rank: number
  percentage: number
  accent_color?: string
}

interface LiveDailySummary {
  vote_date: string
  winning_emoji: string
  winning_count: number
  total_votes: number
  unique_emojis: number
  top_5_emojis: Array<{
    emoji: string
    count: number
    percentage: number
  }>
}

// Fetcher for live emoji ranks with pagination
const fetchLiveEmojiRanks = async (date: string, offset: number) => {
  try {
    // Get live results for the date
    const { data: liveResult, error: liveError } = await supabase
      .from("live_results")
      .select("emoji_counts, total_votes")
      .eq("vote_date", date)
      .single()

    if (liveError || !liveResult?.emoji_counts) {
      return []
    }

    const voteCounts = liveResult.emoji_counts as { [key: string]: number }
    const totalVotes = liveResult.total_votes

    // Get vote timing data for ranking
    const { data: voteTimingData, error: timingError } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", date)

    if (timingError) {
      console.error("Error fetching vote timing data:", timingError)
    }

    // Use simple ranking (same as chyron service)
    const simpleRankings = buildSimpleRankings(
      voteCounts,
      totalVotes,
      voteTimingData || [],
      offset + PAGE_SIZE // Get enough for this page
    )

    // Get emoji metadata for accent colors
    const emojisInPage = simpleRankings.slice(offset, offset + PAGE_SIZE)
    const emojiList = emojisInPage.map((r) => r.emoji)

    const { data: emojiData } = await supabase
      .from("emojis")
      .select("emoji, accent_color")
      .in("emoji", emojiList)

    const emojiColorMap = new Map(
      emojiData?.map((e) => [e.emoji, e.accent_color]) || []
    )

    // Convert to the expected format with pagination
    return emojisInPage.map((ranking) => ({
      id: `${date}-${ranking.emoji}-${ranking.rank}`,
      vote_date: date,
      emoji: ranking.emoji,
      vote_count: ranking.count,
      rank: ranking.rank,
      percentage: ranking.percentage,
      accent_color: emojiColorMap.get(ranking.emoji) || "#FFD700",
    }))
  } catch (error) {
    console.error("Error in fetchLiveEmojiRanks:", error)
    return []
  }
}

// Fetcher for live daily summary
const fetchLiveDailySummary = async (date: string) => {
  try {
    // Get live results
    const { data: liveResult, error: liveError } = await supabase
      .from("live_results")
      .select("emoji_counts, total_votes")
      .eq("vote_date", date)
      .single()

    if (liveError || !liveResult?.emoji_counts) {
      throw new Error("No live results found")
    }

    const voteCounts = liveResult.emoji_counts as { [key: string]: number }
    const totalVotes = liveResult.total_votes
    const uniqueEmojis = Object.keys(voteCounts).length

    // Get vote timing data for ranking
    const { data: voteTimingData } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", date)

    // Use simple ranking to get top results
    const simpleRankings = buildSimpleRankings(
      voteCounts,
      totalVotes,
      voteTimingData || [],
      5 // Top 5 for summary
    )

    const winner = simpleRankings[0]
    const top5 = simpleRankings.map((r) => ({
      emoji: r.emoji,
      count: r.count,
      percentage: r.percentage,
    }))

    return {
      vote_date: date,
      winning_emoji: winner?.emoji || "",
      winning_count: winner?.count || 0,
      total_votes: totalVotes,
      unique_emojis: uniqueEmojis,
      top_5_emojis: top5,
    }
  } catch (error) {
    console.error("Error in fetchLiveDailySummary:", error)
    throw error
  }
}

export function useLiveEmojiRanks(date: string) {
  // Use SWR infinite for pagination
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    (pageIndex) => {
      if (!date) return null
      return [
        `live-emoji-ranks-${date}-${pageIndex}`,
        date,
        pageIndex * PAGE_SIZE,
      ]
    },
    ([, date, offset]) => fetchLiveEmojiRanks(date, offset),
    {
      revalidateFirstPage: true, // Enable revalidation of first page for live updates
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000, // Refresh every 5 seconds like live results
      dedupingInterval: 2000, // Prevent too frequent duplicate requests
    }
  )

  // Flatten all pages into one array
  const allRanks = data ? data.flat() : []
  const isLoadingInitialData = !data && !error
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined")
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE)

  return {
    ranks: allRanks,
    isLoading: isLoadingInitialData,
    isLoadingMore,
    isError: error,
    isEmpty,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
    mutate,
  }
}

export function useLiveDailySummary(date: string) {
  const { data, error, mutate } = useSWR(
    date ? [`live-daily-summary-${date}`, date] : null,
    ([, date]) => fetchLiveDailySummary(date),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  )

  return {
    summary: data,
    isLoading: !data && !error,
    isError: error,
    mutate,
  }
}
