"use client";

import { Button } from "./ui/Button";
import Emoji from "./Emoji";

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
        <h2 className="text-2xl font-bold text-gray-900">Are you sure?</h2>
        <p className="text-gray-600">
          You only get one vote per day, so make sure it counts.
          This is what your vote will look like as an NFT:
        </p>
      </div>

      {/* NFT Preview */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl shadow-lg">
          <Emoji
            emoji={emoji}
            containerSize={200}
            borderWidth={12}
            accentColor={accentColor}
          />
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-gray-900">{emojiName}</p>
            <p className="text-sm text-gray-500">
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
        <p className="text-sm text-gray-500">
          When humans in 2125 look back at today, will they think we picked the right one?
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-4 justify-center">
          <Button
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Go Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="px-8 py-3 text-white font-semibold"
            style={{ backgroundColor: accentColor }}
          >
            Confirm Your Vote
          </Button>
        </div>
      </div>
    </div>
  );
} 