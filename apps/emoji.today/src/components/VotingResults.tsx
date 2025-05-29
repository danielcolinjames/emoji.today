"use client";

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

export function VotingResults({ results, totalVotes, userVote, voteDate }: VotingResultsProps) {
  // Sort results by count descending
  const sortedResults = [...results].sort((a, b) => b.count - a.count);
  const winningEmoji = sortedResults[0];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 text-white">Today's Results</h2>
        <p className="text-gray-400">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast on {new Date(voteDate).toLocaleDateString()}
        </p>
        {winningEmoji && (
          <div className="mt-4 p-4 rounded-lg border border-gray-600 bg-gray-800">
            <div className="text-3xl mb-2">{winningEmoji.emoji}</div>
            <p className="text-sm text-gray-300">
              <strong>{emojiNames[winningEmoji.emoji]}</strong> is winning with {winningEmoji.percentage}% of votes!
            </p>
          </div>
        )}
      </div>

      {/* Results Bars */}
      <div className="space-y-6">
        {sortedResults.map((result) => {
          const isUserVote = result.emoji === userVote;
          const color = emojiColors[result.emoji] || "#6B7280";

          return (
            <div key={result.emoji} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{result.emoji}</span>
                  <div>
                    <span className="font-medium text-white">
                      {emojiNames[result.emoji]}
                    </span>
                    {isUserVote && (
                      <span className="ml-2 text-sm text-gray-400">(Your vote)</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{result.percentage}%</div>
                  <div className="text-sm text-gray-400">{result.count} {result.count === 1 ? 'vote' : 'votes'}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${result.percentage}%`,
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-400 mt-8">
        Come back tomorrow for a new vote!
      </div>
    </div>
  );
} 