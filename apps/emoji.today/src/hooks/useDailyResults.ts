"use client"

import useSWR from "swr"
import { getDailyResultsData } from "@/lib/actions"
import { useState, useCallback, useEffect } from "react"
import type { EmojiVoteCount } from "@/lib/actions"

export interface DailyResultsData {
  results: EmojiVoteCount[]
  totalVotes: number
  userVote: string
  voteDate: string
  hasMore: boolean
  totalUniqueEmojis: number
  lastUpdated: string
}

const PAGE_SIZE = 10

export function useDailyResults() {
  const [allResults, setAllResults] = useState<EmojiVoteCount[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Fetch initial data
  const {
    data: initialData,
    error,
    mutate,
    isLoading,
  } = useSWR<DailyResultsData | null>(
    "daily-results-initial",
    () => getDailyResultsData(0, PAGE_SIZE),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        if (data) {
          setAllResults(data.results)
          setHasMore(data.hasMore)
        }
      },
    }
  )

  // Listen for cross-tab vote updates
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("emoji-votes-updated")

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "VOTES_UPDATED") {
          // Refresh the data when votes are updated in another tab
          mutate()
        }
      }

      channel.addEventListener("message", handleMessage)

      return () => {
        channel.removeEventListener("message", handleMessage)
        channel.close()
      }
    }
  }, [mutate])

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !initialData) return

    setIsLoadingMore(true)
    try {
      const moreData = await getDailyResultsData(allResults.length, PAGE_SIZE)
      if (moreData) {
        setAllResults((prev) => [...prev, ...moreData.results])
        setHasMore(moreData.hasMore)
      }
    } catch (error) {
      console.error("Error loading more results:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, allResults.length, initialData])

  const refresh = useCallback(async () => {
    setAllResults([])
    setHasMore(true)
    await mutate()
  }, [mutate])

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
    data: initialData
      ? {
          ...initialData,
          results: allResults.length > 0 ? allResults : initialData.results,
        }
      : null,
    error,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    getTimeSinceUpdate: initialData?.lastUpdated
      ? () => getTimeSinceUpdate(initialData.lastUpdated)
      : () => "Just now",
  }
}
