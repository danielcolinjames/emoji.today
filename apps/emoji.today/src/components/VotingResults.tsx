"use client";

import Emoji from '@/components/Emoji';
import { useState, useEffect } from 'react';
import { useLiveVotingResults, type EmojiVoteCount } from '@/hooks/useLiveVotingResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Copy } from 'lucide-react';

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
          className="text-white"
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

  // Find the user's emoji data to get the accent color
  // Handle variation selector mismatches by checking multiple formats
  const findUserEmojiData = (userVote: string, results: EmojiVoteCount[]) => {
    // First try exact match
    let userData = results.find(result => result.emoji === userVote);
    if (userData) return userData;

    // Try with variation selector normalized
    const baseUserVote = userVote.replace(/\uFE0F/g, "");
    const withVariationSelector = baseUserVote + "\uFE0F";

    userData = results.find(result =>
      result.emoji === baseUserVote ||
      result.emoji === withVariationSelector ||
      result.emoji.replace(/\uFE0F/g, "") === baseUserVote
    );

    return userData;
  };

  const userEmojiData = findUserEmojiData(userVote, results);
  const userAccentColor = userEmojiData?.accent_color || '#FFFFFF';

  // Sort results by count descending
  const sortedResults = [...results].sort((a, b) => b.count - a.count);

  // Show top 10 or all based on state
  const visibleResults = showAll ? sortedResults : sortedResults.slice(0, 10);
  const hasMore = sortedResults.length > 10;

  const handleShareX = async () => {
    if (!userVote) return;

    const today = new Date().toISOString().split('T')[0];
    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${today}&accentColor=${encodeURIComponent(userAccentColor)}`;
    const text = encodeURIComponent(`I just voted ${userVote} for today's emoji on emoji.today!\n\nWhat emoji do you think best represents today?`);
    const xUrl = `https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;

    window.open(xUrl, '_blank', 'width=550,height=420');
  };

  const handleShareFarcaster = async () => {
    if (!userVote) return;

    const today = new Date().toISOString().split('T')[0];
    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${today}&accentColor=${encodeURIComponent(userAccentColor)}`;
    const text = encodeURIComponent(`I just voted ${userVote} for today's emoji on emoji.today!\n\nWhat emoji do you think best represents today?\n\n${shareUrl}`);
    const farcasterUrl = `https://warpcast.com/~/compose?text=${text}`;

    window.open(farcasterUrl, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    if (!userVote) return;

    const today = new Date().toISOString().split('T')[0];
    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${today}&accentColor=${encodeURIComponent(userAccentColor)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy link');
    }
  };

  return (
    <div className="space-y-1 pb-20">
      <p className="text-white text-base text-center font-geist-mono mb-2">
        Now it's time to campaign.
      </p>
      <div className="flex flex-row items-center justify-center mb-4 gap-4">
        <button
          onClick={handleShareX}
          className="bg-black text-white border border-white/20 font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-white/10"
          title="Share on X"
        >
          <img src="/images/x-white.svg" alt="X" className="max-w-[16px] max-h-[16px]" />
        </button>
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
      {/* Results - Break out completely to full screen width with right padding */}
      <div className="space-y-2 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pr-4">
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
                      `You & ${otherVoters} voter${otherVoters !== 1 ? 's' : ''}`
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
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(true)}
            className="text-[#696969] font-medium transition-colors duration-200"
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
            className="text-[#696969] font-medium transition-colors duration-200"
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