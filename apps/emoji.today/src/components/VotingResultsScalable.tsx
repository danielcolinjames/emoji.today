"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import Emoji from '@/components/Emoji'
import { Copy } from 'lucide-react'
import { useEmojiRanks, useDailySummary } from '@/hooks/useEmojiRanks'
import { formatInTimeZone } from 'date-fns-tz'
import LoadingSpinner from '@/components/LoadingSpinner'
import { handleFarcasterShare, generateVoteShareUrl } from '@/lib/farcaster-share'

interface VotingResultsScalableProps {
  userVote?: string
}

export function VotingResultsScalable({ userVote }: VotingResultsScalableProps) {
  const { data: session } = useSession()
  const [showAll, setShowAll] = useState(false)

  // Use UTC date to match database
  const todayString = formatInTimeZone(new Date(), 'UTC', 'yyyy-MM-dd')

  const { summary, isLoading: summaryLoading, isError: summaryError } = useDailySummary(todayString)
  const {
    ranks,
    isLoading: ranksLoading,
    isLoadingMore,
    loadMore,
    isReachingEnd,
    isError: ranksError
  } = useEmojiRanks(todayString)

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    if (target.isIntersecting && !isLoadingMore && !isReachingEnd && showAll) {
      loadMore()
    }
  }, [isLoadingMore, isReachingEnd, loadMore, showAll])

  useEffect(() => {
    if (!showAll) return // Don't observe if not showing all

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0
    })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [handleObserver, showAll])

  // Helper function to convert number to ordinal
  const getOrdinal = (num: number): string => {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (summaryLoading || ranksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  // Log errors if any - check if errors actually contain meaningful data
  const hasActualErrors = (summaryError && Object.keys(summaryError).length > 0) ||
    (ranksError && Object.keys(ranksError).length > 0)

  if (hasActualErrors) {
    console.error('VotingResultsScalable - errors:', {
      summaryError,
      ranksError,
      todayString
    })

    return (
      <div className="text-center space-y-4">
        <div className="text-red-400">Error loading voting results</div>
      </div>
    )
  }

  if (!summary || !ranks || ranks.length === 0) {
    console.log('VotingResultsScalable - no data:', {
      summary,
      ranks: ranks?.length,
      todayString
    })
    return (
      <div className="text-center space-y-4">
        <div className="text-neutral-400">No votes yet today!</div>
      </div>
    )
  }

  // Get accent color for user's emoji
  const userRank = ranks.find(r => r.emoji === userVote)
  const userAccentColor = userRank?.accent_color || "#FFFFFF"

  // Determine which results to show
  const visibleResults = showAll ? ranks : ranks.slice(0, 5);
  const hasMore = ranks.length > 5;

  // Check if user's vote is in the visible results
  const userVoteInVisible = visibleResults.some(rank => rank.emoji === userVote);
  const showUserEmojiInButton = hasMore && !userVoteInVisible && !showAll && userVote;

  const handleShareFarcaster = async () => {
    if (!userVote) return;
    handleFarcasterShare({
      emoji: userVote,
      date: todayString,
      accentColor: userAccentColor
    });
  };

  const handleCopyLink = async () => {
    if (!userVote) return;

    const shareUrl = generateVoteShareUrl({
      emoji: userVote,
      date: todayString,
      accentColor: userAccentColor
    });

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-1 pb-20">
      <p
        className="text-base text-center font-geist-mono mb-2 -mt-2"
        style={{ color: userAccentColor }}
      >
        Now it's time to campaign.
      </p>

      {/* Share buttons */}
      <div className="flex flex-row items-center justify-center mb-4 gap-4">
        <button
          onClick={handleShareFarcaster}
          className="bg-black text-white border border-white/20 font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-white/10"
          title="Share on Farcaster"
        >
          <img src="/images/farcaster-white.svg" alt="Farcaster" className="max-w-[18px] max-h-[18px]" />
        </button>
        <button
          onClick={handleCopyLink}
          className="bg-black text-white border border-white/20 font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-white/10"
          title="Copy share link"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {/* Results - Full screen width with right padding */}
      <div className="space-y-2 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pr-4 overflow-x-hidden">
        {visibleResults.map((rank) => {
          // Get accent color directly from the rank data
          const accentColor = rank.accent_color || "#FFD700"

          // Calculate proportional width
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
          // Account for scrollbars and add extra margin for safety
          const availableWidth = Math.max(320, viewportWidth - 32); // Increased margin and minimum width
          const minWidthPercent = 0.55;
          const maxWidthPercent = 0.98; // Reduced to 98% to prevent overflow

          // Use visible results for width calculation when not showing all
          const ranksForWidth = showAll ? ranks : visibleResults;
          const maxVotes = ranksForWidth[0].vote_count;
          const minVotes = ranksForWidth[ranksForWidth.length - 1].vote_count;

          let widthPercent;
          if (maxVotes === minVotes) {
            widthPercent = maxWidthPercent;
          } else {
            const voteRange = maxVotes - minVotes;
            const votePosition = rank.vote_count - minVotes;
            widthPercent = minWidthPercent + (maxWidthPercent - minWidthPercent) * (votePosition / voteRange);
          }

          const finalWidth = Math.min(availableWidth * widthPercent, availableWidth); // Cap at available width

          const isUserVote = rank.emoji === userVote;
          const otherVoters = Math.max(0, rank.vote_count - (isUserVote ? 1 : 0));

          return (
            <div
              key={`${rank.emoji}-${rank.rank}`}
              className="flex items-center rounded-r-full border-r border-t border-b relative"
              style={{
                backgroundColor: hexToRgba(accentColor, 1),
                borderColor: hexToRgba(accentColor, 1),
                width: `${finalWidth}px`,
                maxWidth: '98vw', // Additional safeguard
              }}
            >
              {/* Position number */}
              <div className="text-xs text-black font-bold font-geist-mono pl-3">
                {getOrdinal(rank.rank)}
              </div>

              {/* Vote count */}
              <div className="flex items-center text-black text-sm pl-4 flex-1 relative">
                {isUserVote ? (
                  <span className="text-xs flex items-center gap-1.5">
                    {otherVoters > 0 ? (
                      <>
                        <div className="bg-black/10 rounded-full px-2 py-0.5 text-xs text-black font-medium">
                          You
                        </div>
                        <span className="text-black/60">
                          & {otherVoters} other{otherVoters !== 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 -ml-1">
                        <p className="text-xs">Just you</p>
                        <img
                          src="/images/sad.svg"
                          alt="sad"
                          className="w-3 h-3"
                          style={{ filter: 'invert(1)' }}
                        />
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs">
                    {rank.vote_count} voter{rank.vote_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <Emoji emoji={rank.emoji} containerSize={50} borderWidth={3} accentColor={accentColor} />
            </div>
          );
        })}
      </div>

      {/* View More Button */}
      {hasMore && !showAll && (
        <div className="text-center mt-6 sm:mt-12">
          <button
            onClick={() => setShowAll(true)}
            className="text-[#696969] transition-colors duration-200 flex items-center justify-center gap-2 mx-auto bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 border border-white/10 hover:cursor-pointer"
          >
            <span>View more results</span>
            {showUserEmojiInButton && (
              <span className="text-base">{userVote}</span>
            )}
            <span>↓</span>
          </button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {showAll && (
        <div ref={loadMoreRef} className="text-center py-8">
          {isLoadingMore && (
            <div className="flex items-center justify-center">
              <LoadingSpinner size={32} />
            </div>
          )}
          {isReachingEnd && ranks.length > 0 && (
            <div className="text-neutral-500 text-sm">
              {ranks.length === summary.unique_emojis ? (
                <p>That's all {summary.unique_emojis} emojis!</p>
              ) : (
                <p>Showing {ranks.length} of {summary.unique_emojis} emojis</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fixed Live Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-neutral-800 px-4 pt-2 pb-6 z-50">
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2 rounded-full bg-green-400">
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75"></div>
            </div>
            <div className="text-neutral-500 text-xs uppercase tracking-wider font-mono">
              LIVE
            </div>
            <span className="text-neutral-600 text-xs font-geist-mono">
              {summary.total_votes} vote{summary.total_votes !== 1 ? 's' : ''} today
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 