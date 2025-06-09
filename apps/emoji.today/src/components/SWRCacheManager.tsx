"use client"

import { useEffect } from "react"
import { invalidateVotingCaches } from "@/lib/swr-utils"
import { supabasePublic } from '@/lib/supabase-public'

/**
 * Component that manages SWR cache invalidation across browser tabs
 * Listens for localStorage events to trigger cache revalidation
 */
export function SWRCacheManager() {
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "emoji-vote-update" && event.newValue) {
        try {
          const updateData = JSON.parse(event.newValue)
          const { date, timestamp } = updateData

          // Only invalidate if this is a recent update (within last 5 seconds)
          const now = Date.now()
          if (now - timestamp < 5000) {
            console.log("📡 Received vote update, invalidating caches...")
            invalidateVotingCaches(date)
          }
        } catch (error) {
          console.error("Error parsing vote update data:", error)
        }
      }
    }

    // Listen for storage events (cross-tab communication)
    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events on the same tab
    const handleCustomVoteUpdate = (event: CustomEvent) => {
      const { date } = event.detail
      console.log("📡 Local vote update, invalidating caches...")
      invalidateVotingCaches(date)
    }

    window.addEventListener("vote-update", handleCustomVoteUpdate as EventListener)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("vote-update", handleCustomVoteUpdate as EventListener)
    }
  }, [])

  // Listen to Supabase realtime changes on live_results so all tabs refresh instantly
  useEffect(() => {
    const client = supabasePublic()
    const channel = client
      .channel('public:live_results')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_results' },
        (payload) => {
          const date = (payload.new as any)?.vote_date as string | undefined
          console.log('📡 Realtime live_results update', date)
          invalidateVotingCaches(date)
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Trigger cache invalidation from server actions or client-side code
 */
export function triggerVoteCacheUpdate(date?: string) {
  if (typeof window === "undefined") return

  const updateData = {
    date: date || new Date().toISOString().split("T")[0],
    timestamp: Date.now(),
  }

  // Set localStorage to trigger storage event in other tabs
  localStorage.setItem("emoji-vote-update", JSON.stringify(updateData))

  // Remove it immediately (we only care about the event)
  setTimeout(() => {
    localStorage.removeItem("emoji-vote-update")
  }, 100)

  // Trigger custom event for same tab
  window.dispatchEvent(new CustomEvent("vote-update", {
    detail: { date: updateData.date }
  }))
} 