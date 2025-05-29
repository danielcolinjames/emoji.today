"use client";

import Emoji from "@/components/Emoji";

interface VoteConfirmationProps {
  emoji: string;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
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

export function VoteConfirmation({ emoji, onConfirm, onBack, isLoading = false }: VoteConfirmationProps) {
  const emojiName = emojiNames[emoji] || "Unknown";
  const accentColor = emojiColors[emoji] || "#6B7280";

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Are you sure?</h2>
        <p className="text-gray-400">
          You only get one vote per day, so make sure it counts.
          This is what your vote will look like as an NFT:
        </p>
      </div>

      {/* NFT Preview */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-lg">
          <Emoji
            emoji={emoji}
            containerSize={200}
            borderWidth={12}
          />
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-white">{emojiName}</p>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          When humans in 2125 look back at today, will they think we picked the right one?
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-8 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {isLoading ? 'Confirming...' : 'Confirm Your Vote'}
          </button>
        </div>
      </div>
    </div>
  );
} 