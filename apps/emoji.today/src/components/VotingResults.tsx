"use client";

import { VotingCountdown } from '@/components/VotingCountdown';
import Emoji from '@/components/Emoji';

interface EmojiVoteCount {
  emoji: string;
  count: number;
  percentage: number;
}

interface VotingResultsProps {
  results: EmojiVoteCount[];
  totalVotes: number;
  userVote: string;
  voteDate: string;
}

const emojiNames: { [key: string]: string } = {
  "🙂": "Happy",
  "🌱": "Growth",
  "💦": "Flow",
  "🔥": "Energy",
};

const emojiColors: { [key: string]: string } = {
  "🙂": "#FFC107",
  "🌱": "#4CAF50",
  "💦": "#2196F3",
  "🔥": "#FF5722",
};

// Fake data for debugging - toggle this flag
const USE_FAKE_DATA = false;

const fakeResults: EmojiVoteCount[] = [
  { emoji: "💯", count: 11083, percentage: 52 },
  { emoji: "🔥", count: 7083, percentage: 33 },
  { emoji: "👍", count: 2241, percentage: 11 },
  { emoji: "💭", count: 805, percentage: 4 },
];

export function VotingResults({ results, totalVotes, userVote, voteDate }: VotingResultsProps) {
  // Use fake data if flag is enabled
  const displayResults = USE_FAKE_DATA ? fakeResults : results;
  const displayTotalVotes = USE_FAKE_DATA ? 21212 : totalVotes;
  const displayUserVote = USE_FAKE_DATA ? "💯" : userVote;

  // Sort results by count descending
  const sortedResults = [...displayResults].sort((a, b) => b.count - a.count);

  // Format the date
  const formattedDate = new Date(voteDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tighter text-white">
          What emoji is today?
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 font-light">
          {formattedDate}
        </p>
      </div>

      {/* Countdown Timer */}
      <div className="text-center">
        <VotingCountdown />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {sortedResults.map((result, index) => {
          const isUserVote = result.emoji === displayUserVote;
          const color = emojiColors[result.emoji] || "#6B7280";
          const isWinning = index === 0;

          return (
            <div
              key={result.emoji}
              className="flex items-center justify-between py-4 px-6 rounded-2xl transition-all duration-300"
              style={{
                background: `linear-gradient(90deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
              }}
            >
              {/* Left side - Emoji and info */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Emoji
                    emoji={result.emoji}
                    containerSize={64}
                    borderWidth={0}
                    accentColor={color}
                  />
                  {isWinning && (
                    <div
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: color, color: 'white' }}
                    >
                      1
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-lg font-medium text-white">
                    {emojiNames[result.emoji] || result.emoji}
                  </span>
                  {isUserVote && (
                    <span className="text-sm text-neutral-400">Your vote</span>
                  )}
                </div>
              </div>

              {/* Right side - Stats */}
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold text-white">
                  {result.percentage}%
                </div>
                <div className="text-sm text-neutral-400">
                  {result.count.toLocaleString()} {result.count === 1 ? 'vote' : 'votes'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bars Section */}
      <div className="space-y-3">
        {sortedResults.map((result) => {
          const color = emojiColors[result.emoji] || "#6B7280";
          const isUserVote = result.emoji === displayUserVote;

          return (
            <div key={`bar-${result.emoji}`} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{result.emoji}</span>
                  <span className="text-white font-medium">
                    {emojiNames[result.emoji] || result.emoji}
                  </span>
                  {isUserVote && (
                    <span className="text-neutral-400 text-xs">• Your vote</span>
                  )}
                </div>
                <span className="text-white font-bold">
                  {result.percentage}%
                </span>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="w-full bg-neutral-800 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${result.percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total votes indicator */}
      <div className="text-center text-neutral-500">
        <p className="text-lg">
          {displayTotalVotes.toLocaleString()} total {displayTotalVotes === 1 ? 'vote' : 'votes'}
        </p>
      </div>

      {/* Footer message */}
      <div className="text-center text-neutral-400 text-sm space-y-2">
        <p>Results update in real-time as votes come in.</p>
        <p>Share this page to get more people voting!</p>
      </div>
    </div>
  );
}