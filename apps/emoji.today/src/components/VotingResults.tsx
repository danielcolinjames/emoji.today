"use client";

import Emoji from '@/components/Emoji';
import { useState, useEffect } from 'react';
import { useLiveVotingResults, type EmojiVoteCount } from '@/hooks/useLiveVotingResults';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VotingResultsProps {
  userProfileUrl?: string;
}

export function VotingResults({ userProfileUrl }: VotingResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const { data, error, isLoading, isValidating, refresh, getTimeSinceUpdate } = useLiveVotingResults();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="text-red-400">Failed to load results</div>
        <button
          onClick={refresh}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Handle no data (user hasn't voted yet)
  if (!data) {
    return (
      <div className="text-center space-y-4">
        <div className="text-neutral-400">You need to vote to see results!</div>
      </div>
    );
  }

  const { results, totalVotes, userVote } = data;

  // Sort results by count descending
  const sortedResults = [...results].sort((a, b) => b.count - a.count);

  // Show top 10 or all based on state
  const visibleResults = showAll ? sortedResults : sortedResults.slice(0, 10);
  const hasMore = sortedResults.length > 10;

  const handleShare = async () => {
    const shareData = {
      title: 'emoji.today - I voted!',
      text: `I just voted for today's emoji on emoji.today! 🗳️`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Share Button */}
      <div className="text-center">
        <button
          onClick={handleShare}
          className="bg-white text-black font-semibold py-3 px-6 rounded-full transition-colors duration-200 w-full"
        >
          Share my vote
        </button>
      </div>

      {/* Results - Break out completely to full screen width with right padding */}
      <div className="space-y-3 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pr-4">
        {visibleResults.map((result, index) => {
          // Calculate proportional width between 55% and 100% of viewport minus right padding
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
          const availableWidth = viewportWidth - 16; // Subtract 16px for pr-4
          const minWidthPercent = 0.55; // 55%
          const maxWidthPercent = 1.0;  // 100%

          // Find min and max votes in visible results for scaling
          const maxVotes = visibleResults[0].count; // Already sorted, so first is highest
          const minVotes = visibleResults[visibleResults.length - 1].count; // Last is lowest

          let widthPercent;
          if (maxVotes === minVotes) {
            // If all have same vote count, use 100%
            widthPercent = maxWidthPercent;
          } else {
            // Scale between 55% and 100% based on vote count
            const voteRange = maxVotes - minVotes;
            const votePosition = result.count - minVotes;
            widthPercent = minWidthPercent + (maxWidthPercent - minWidthPercent) * (votePosition / voteRange);
          }

          const finalWidth = availableWidth * widthPercent;

          // Check if this is the user's vote
          const isUserVote = result.emoji === userVote;
          const otherVoters = result.count - (isUserVote ? 1 : 0);

          // Convert hex color to rgba with opacity
          const hexToRgba = (hex: string, opacity: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          };

          return (
            <div
              key={result.emoji}
              className="flex items-center rounded-r-full border-r border-t border-b relative"
              style={{
                backgroundColor: hexToRgba(result.accent_color, 1),
                borderColor: hexToRgba(result.accent_color, 1),
                width: `${finalWidth}px`,
              }}
            >
              {/* User profile pic for their vote - smaller */}
              {isUserVote && userProfileUrl && (
                <div className="absolute left-2 flex items-center">
                  <img
                    src={userProfileUrl}
                    alt="Your vote"
                    className="w-4 h-4 rounded-full"
                  />
                </div>
              )}

              {/* Vote count - positioned on the left in black text */}
              <div className="flex items-center text-black text-sm pl-4 flex-1">
                {isUserVote ? (
                  <span className="ml-2 text-xs">
                    {otherVoters > 0 ? (
                      `You & ${otherVoters} other${otherVoters !== 1 ? 's' : ''}`
                    ) : (
                      <span className="flex items-center gap-1 pl-1">
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
                    {result.count} voter{result.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Emoji container with small index positioned absolutely - rightmost with zero padding */}
              <div className="text-xs text-black font-bold font-geist-mono pr-1">
                {index + 1}
              </div>
              <div className="relative">
                <Emoji
                  emoji={result.emoji}
                  filename={result.filename}
                  containerSize={60}
                  borderWidth={3}
                  accentColor={result.accent_color}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      {hasMore && !showAll && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
          >
            View all {sortedResults.length} results ↓
          </button>
        </div>
      )}

      {/* Show Less Button */}
      {showAll && hasMore && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(false)}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
          >
            Show top 10 ↑
          </button>
        </div>
      )}

      {/* Fixed Live Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-neutral-800 px-4 pt-2 pb-6 z-50">
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className={`relative w-2 h-2 rounded-full ${isValidating ? 'bg-yellow-400' : 'bg-green-400'}`}>
              {!isValidating && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75"></div>
              )}
            </div>
            <div className="text-neutral-500 text-xs uppercase tracking-wider font-mono">
              LIVE
            </div>
            <span className="text-neutral-600 text-xs font-geist-mono">
              Last vote {getTimeSinceUpdate()}.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}