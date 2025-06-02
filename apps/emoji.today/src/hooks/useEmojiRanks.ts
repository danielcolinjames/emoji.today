import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 10

interface EmojiRank {
  id: string
  vote_date: string
  emoji: string
  vote_count: number
  rank: number
  percentage: number
  accent_color?: string
}

interface DailySummary {
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

// Fetcher for emoji ranks with pagination
const fetchEmojiRanks = async (date: string, offset: number) => {
  const { data, error } = await supabase
    .from("emoji_ranks" as any)
    .select("*")
    .eq("vote_date", date)
    .order("rank", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) throw error
  return data as unknown as EmojiRank[]
}

// Fetcher for daily summary
const fetchDailySummary = async (date: string) => {
  const { data, error } = await supabase
    .from("daily_summaries" as any)
    .select("*")
    .eq("vote_date", date)
    .single()

  if (error) throw error
  return data as unknown as DailySummary
}

export function useEmojiRanks(date: string) {
  // Use SWR infinite for pagination
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    (pageIndex) => {
      if (!date) return null
      return [`emoji-ranks-${date}-${pageIndex}`, date, pageIndex * PAGE_SIZE]
    },
    ([, date, offset]) => fetchEmojiRanks(date, offset),
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
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

export function useDailySummary(date: string) {
  const { data, error, mutate } = useSWR(
    date ? [`daily-summary-${date}`, date] : null,
    ([, date]) => fetchDailySummary(date),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    summary: data,
    isLoading: !data && !error,
    isError: error,
    mutate,
  }
}
