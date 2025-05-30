"use client"

import useSWR from "swr"
import { getLiveVotingResults } from "@/lib/actions"

export interface EmojiVoteCount {
  emoji: string
  count: number
  percentage: number
  accent_color: string
  filename: string
}

export interface LiveVotingResultsData {
  results: EmojiVoteCount[]
  totalVotes: number
  userVote: string
  voteDate: string
  lastUpdated: string
}

const fetcher = async (): Promise<LiveVotingResultsData | null> => {
  try {
    return await getLiveVotingResults()
  } catch (error) {
    console.error("Error fetching live results:", error)
    throw error
  }
}

export function useLiveVotingResults() {
  const { data, error, mutate, isLoading, isValidating } =
    useSWR<LiveVotingResultsData | null>("live-voting-results", fetcher, {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    })

  const refresh = () => mutate()

  // Calculate time since last update
  const getTimeSinceUpdate = (lastUpdated: string): string => {
    const now = new Date()
    const updated = new Date(lastUpdated)
    const diffMs = now.getTime() - updated.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
      return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
    } else {
      const diffHours = Math.floor(diffMinutes / 60)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    }
  }

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    getTimeSinceUpdate: data?.lastUpdated
      ? () => getTimeSinceUpdate(data.lastUpdated)
      : () => "Just now",
  }
}
