"use client";

import Emoji from '@/components/Emoji';
import { useState } from 'react';
import { useLiveVotingResults, type EmojiVoteCount } from '@/hooks/useLiveVotingResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Copy, Check } from 'lucide-react';

interface VotingResultsProps {
  userProfileUrl?: string;
}

export function VotingResults({ userProfileUrl }: VotingResultsProps) {
  const { data, error, isLoading, isValidating, refresh, getTimeSinceUpdate } = useLiveVotingResults();
  const [copySuccess, setCopySuccess] = useState(false);

  // Helper function to convert number to ordinal
  const getOrdinal = (num: number): string => {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

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
  const userAccentColor = userEmojiData?.accent_color || "#FFFFFF";

  // Sort results by count descending
  const sortedResults = [...results].sort((a, b) => b.count - a.count);

  // Show top 5 or all based on state
  const visibleResults = sortedResults.slice(0, 5);

  // Check if user's vote is in the visible top 5
  const userVoteInVisible = visibleResults.some(result => {
    const normalizeEmoji = (emoji: string) => emoji.replace(/\uFE0F/g, "");
    return result.emoji === userVote ||
      normalizeEmoji(result.emoji) === normalizeEmoji(userVote);
  });

  // Show user's emoji in button if not in visible results
  const showUserEmojiInButton = sortedResults.length > 5 && !userVoteInVisible;

  const handleShareFarcaster = async () => {
    if (!userVote) return;

    const today = new Date().toISOString().split('T')[0];
    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${today}&accentColor=${encodeURIComponent(userAccentColor)}`;

    // Open Farcaster compose with the share URL
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(`I just voted ${userVote} for today's emoji on emoji.today!\n\nWhat emoji do you think best represents today? https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday`)}&embeds[]=${encodeURIComponent(shareUrl)}`;

    window.open(farcasterUrl, '_blank');
  };

  const handleCopyLink = async () => {
    console.log('📋 Copy button clicked, userVote:', userVote);
    if (!userVote) {
      console.log('📋 No userVote, returning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const shareUrl = `${window.location.origin}/share?emoji=${encodeURIComponent(userVote)}&date=${today}&accentColor=${encodeURIComponent(userAccentColor)}`;
    const textToCopy = `${shareUrl} https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday`;
    console.log('📋 Share URL with mini app:', textToCopy);

    try {
      await navigator.clipboard.writeText(textToCopy);
      console.log('📋 Copy successful, setting copySuccess to true, current state:', copySuccess);
      setCopySuccess(true);
      console.log('📋 State should now be true');
      setTimeout(() => {
        console.log('📋 Resetting copySuccess to false');
        setCopySuccess(false);
      }, 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('📋 Failed to copy:', err);
    }
  };

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className="space-y-1">
      <p
        className="text-base text-center font-geist-mono mb-2"
        style={{ color: userAccentColor }}
      >
        Now it's time to campaign.
      </p>
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
          title={copySuccess ? "Link copied!" : "Copy share link"}
        >
          {copySuccess ? (
            <span className="text-white font-bold">✓ COPIED</span>
          ) : (
            <Copy className="w-4 h-4 text-white" />
          )}
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
          const normalizeEmoji = (emoji: string) => emoji.replace(/\uFE0F/g, "");
          const isUserVote = result.emoji === userVote ||
            normalizeEmoji(result.emoji) === normalizeEmoji(userVote);

          // Calculate other voters
          const otherVoters = Math.max(0, result.count - (isUserVote ? 1 : 0));

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
              {/* Position number - positioned on the left in black text */}
              <div className="text-xs text-black font-bold font-geist-mono pl-3">
                {getOrdinal(index + 1)}
              </div>

              {/* Vote count container - moved to center area */}
              <div className="flex items-center text-black text-sm pl-4 flex-1 relative">
                {isUserVote ? (
                  <span className="text-xs flex items-center gap-1.5">
                    {otherVoters > 0 ? (
                      <>
                        {/* User profile pic for their vote */}
                        {userProfileUrl && (
                          <img
                            src={userProfileUrl}
                            alt="Your vote"
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <div className="bg-black/10 rounded-full px-2 py-0.5 text-xs text-black font-medium">
                          You
                        </div>
                        <span className="text-black/60">
                          & {otherVoters} other{otherVoters !== 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 -ml-1">
                        {/* User profile pic for their vote - smaller */}
                        {userProfileUrl && (
                          <img
                            src={userProfileUrl}
                            alt="Your vote"
                            className="w-4 h-4 rounded-full"
                          />
                        )}
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

              <Emoji emoji={result.emoji} containerSize={50} borderWidth={3} accentColor={result.accent_color} />
            </div>
          );
        })}
      </div>

      {/* Show user's emoji at bottom if not in visible list */}
      {showUserEmojiInButton && userEmojiData && (
        <div className="text-center mt-8 pt-8 border-t border-neutral-800">
          <p className="text-neutral-500 text-xs mb-3">Your vote</p>
          <div className="flex items-center justify-center gap-3">
            <Emoji emoji={userVote} containerSize={40} borderWidth={2} accentColor={userAccentColor} />
            <span className="text-sm text-neutral-400">
              Ranked #{sortedResults.findIndex(r => r.emoji === userVote || r.emoji === userVote.replace(/\uFE0F/g, "") || r.emoji.replace(/\uFE0F/g, "") === userVote.replace(/\uFE0F/g, "")) + 1}
            </span>
          </div>
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