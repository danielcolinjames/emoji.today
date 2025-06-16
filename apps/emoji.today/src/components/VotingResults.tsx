"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import Emoji from '@/components/Emoji'
import { Copy, Check } from 'lucide-react'
import { useLiveEmojiRanks, useLiveDailySummary } from '@/hooks/useLiveEmojiRanks'
import { formatInTimeZone } from 'date-fns-tz'
import LoadingSpinner from '@/components/LoadingSpinner'
import { RaceChyron } from '@/components/RaceChyron'
import { supabase } from '@/lib/supabase'
import { getContrastColor } from './voting/ConfirmEmoji'

interface VotingResultsProps {
  userVote?: string
}

export function VotingResults({ userVote }: VotingResultsProps) {
  const { data: session } = useSession()
  const [showAll, setShowAll] = useState(false)
  const [userAccentColor, setUserAccentColor] = useState<string>("#FFFFFF")
  const [copySuccess, setCopySuccess] = useState(false)

  // Use UTC date to match database
  const todayString = formatInTimeZone(new Date(), 'UTC', 'yyyy-MM-dd')

  const { summary, isLoading: summaryLoading, isError: summaryError } = useLiveDailySummary(todayString)
  const {
    ranks,
    isLoading: ranksLoading,
    isLoadingMore,
    loadMore,
    isReachingEnd,
    isError: ranksError
  } = useLiveEmojiRanks(todayString)

  // Fetch user's accent color separately if they voted
  useEffect(() => {
    const fetchUserAccentColor = async () => {
      if (!userVote) return

      try {
        // Handle variation selector normalization
        const emojiVariants = [
          userVote,
          userVote + "\uFE0F", // Add variation selector
          userVote.replace(/\uFE0F/g, ""), // Remove variation selector
        ].filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

        const { data: emojiData } = await supabase
          .from("emojis")
          .select("accent_color")
          .in("emoji", emojiVariants)
          .limit(1)
          .single()

        if (emojiData?.accent_color) {
          setUserAccentColor(emojiData.accent_color)
        }
      } catch (error) {
        console.error("Error fetching user accent color:", error)
        // Keep default color
      }
    }

    fetchUserAccentColor()
  }, [userVote])

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

  // Log errors and no-data in useEffect to avoid setState during render
  useEffect(() => {
    const hasRealError =
      (summaryError && summaryError instanceof Error) ||
      (ranksError && ranksError instanceof Error)

    if (hasRealError) {
      console.error('VotingResultsScalable - errors:', {
        summaryError,
        ranksError,
        todayString
      })
    }
  }, [summaryError, ranksError, todayString])

  useEffect(() => {
    if (!summaryLoading && !ranksLoading && (!summary || !ranks || ranks.length === 0)) {
      console.log('VotingResultsScalable - no data:', {
        summary,
        ranks: ranks?.length,
        todayString
      })
    }
  }, [summaryLoading, ranksLoading, summary, ranks, todayString])

  if (summaryLoading || ranksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (!summary || !ranks || ranks.length === 0) {
    return (
      <div className="text-center space-y-4">
        <div className="text-neutral-400">No votes yet today!</div>
      </div>
    )
  }

  // Results are already timing-aware from the hook; preserve order
  const sortedResults = ranks;

  // Determine which results to show
  const visibleResults = showAll ? sortedResults : sortedResults.slice(0, 5);
  const hasMore = sortedResults.length > 5;

  // Check if user's vote is in the visible results
  const userVoteInVisible = visibleResults.some(rank => rank.emoji === userVote);
  const showUserEmojiInButton = hasMore && !userVoteInVisible && !showAll && userVote;

  const handleShareFarcaster = async () => {
    if (!userVote) return;

    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${todayString}&accentColor=${encodeURIComponent(userAccentColor)}`;
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(`I just voted ${userVote} for today's emoji on emoji.today!\n\nWhat emoji do you think best represents today? https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday`)}&embeds[]=${encodeURIComponent(shareUrl)}`;

    window.open(farcasterUrl, '_blank');
  };

  const handleCopyLink = async () => {
    if (!userVote) return;

    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${todayString}&accentColor=${encodeURIComponent(userAccentColor)}`;
    const textToCopy = `${shareUrl} https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  console.log("userAccentColor", userAccentColor)
  console.log("getContrastColor(userAccentColor)", getContrastColor(userAccentColor))

  const isBlack = getContrastColor(userAccentColor) === "#000000"

  return (
    <div className="space-y-1">
      <p
        className="text-base text-center font-geist-mono mb-2 -mt-2"
        style={{ color: userAccentColor }}
      >
        Now it's time to campaign.
      </p>

      {/* Share buttons with accent color */}
      <div className="flex flex-row items-center justify-center mb-4 gap-4">
        <button
          onClick={handleShareFarcaster}
          className="font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:opacity-80 h-10 w-20 justify-center"
          style={{
            backgroundColor: userAccentColor,
            color: getContrastColor(userAccentColor),
            border: `1px solid ${userAccentColor}`
          }}
          title="Share on Farcaster"
        >
          <img src="/images/farcaster.svg" alt="Farcaster" className="max-w-[18px] max-h-[18px]" style={{ filter: isBlack ? "none" : "invert(1)" }} />
        </button>
        <button
          onClick={handleCopyLink}
          className="font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:opacity-80 h-10 w-20 justify-center"
          style={{
            backgroundColor: userAccentColor,
            color: getContrastColor(userAccentColor),
            border: `1px solid ${userAccentColor}`
          }}
          title={copySuccess ? "Link copied!" : "Copy share link"}
        >
          {copySuccess ? (
            <Check
              className="w-5 h-5"
              style={{ color: getContrastColor(userAccentColor) }}
            />
          ) : (
            <Copy
              className="w-5 h-5"
              style={{ color: getContrastColor(userAccentColor) }}
            />
          )}
        </button>
      </div>

      {/* Results - Full screen width with right padding */}
      <div
        key={`results-${summary?.total_votes}-${visibleResults.length}`}
        className="space-y-2 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pr-4"
      >
        {visibleResults.map((rank: any) => {
          // Get accent color directly from the rank data
          const accentColor = rank.accent_color || "#FFD700"

          // Calculate proportional width
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
          const availableWidth = viewportWidth - 16;
          const minWidthPercent = 0.55;
          const maxWidthPercent = 1.0;

          // Use visible results for width calculation when not showing all
          const ranksForWidth = showAll ? sortedResults : visibleResults;
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

          const finalWidth = availableWidth * widthPercent;

          const isUserVote = rank.emoji === userVote;
          const otherVoters = Math.max(0, rank.vote_count - (isUserVote ? 1 : 0));

          return (
            <div
              key={`${rank.emoji}-${rank.rank}-${rank.vote_count}-${finalWidth}`}
              className="flex items-center rounded-r-full border-r border-t border-b relative"
              style={{
                backgroundColor: hexToRgba(accentColor, 1),
                borderColor: hexToRgba(accentColor, 1),
                width: `${finalWidth}px`,
              }}
            >
              {/* Position number */}
              <div className="text-xs text-black font-bold font-geist-mono pl-3">
                {getOrdinal(rank.rank)}
              </div>

              {/* Vote count */}
              <div className="flex items-center text-black text-sm pl-4 flex-1 relative">
                {isUserVote ? (
                  <span key={`user-vote-${rank.vote_count}`} className="text-xs flex items-center gap-1.5">
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
                  <span key={`other-vote-${rank.vote_count}`} className="text-xs">
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
          {isReachingEnd && sortedResults.length > 0 && (
            <div className="text-neutral-500 text-sm">
              {sortedResults.length === summary.unique_emojis ? (
                <p>That's all {summary.unique_emojis} emojis!</p>
              ) : (
                <p>Showing {sortedResults.length} of {summary.unique_emojis} emojis</p>
              )}
            </div>
          )}
        </div>
      )}
      {/* Race Chyron - positioned at very bottom, full width */}
      <RaceChyron className="" />
    </div>
  )
} 