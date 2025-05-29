"use client";

import Emoji from "@/components/Emoji";

interface ConfirmEmojiProps {
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

export function ConfirmEmoji({ emoji, onConfirm, onBack, isLoading = false }: ConfirmEmojiProps) {
  const emojiName = emojiNames[emoji] || "Unknown";
  const accentColor = emojiColors[emoji] || "#6B7280";

  return (
    <div className="space-y-12 text-center">
      {/* Subtitle text */}
      <p className="text-xl sm:text-2xl text-neutral-400 font-light leading-relaxed">
        You only get one vote per day, so make sure it counts.
        <br />
        This is what your vote will look like:
      </p>

      {/* Big Emoji Preview - Same size as home screen */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-12 rounded-3xl shadow-2xl border border-gray-700/50">
          <Emoji
            emoji={emoji}
            containerSize={300}
            borderWidth={18}
          />
          <div className="mt-6 space-y-3">
            <p className="text-2xl font-semibold text-white">{emojiName}</p>
            <p className="text-lg text-gray-400">
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

      {/* Dramatic text */}
      <p className="text-lg text-neutral-400 font-light leading-relaxed">
        When humans in 2125 look back at today, will they think we picked the right one?
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-8 py-4 bg-gray-600/80 text-white hover:bg-gray-600 rounded-xl transition-all duration-200 text-lg font-medium hover:scale-105 active:scale-95"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-12 py-4 text-white font-semibold text-xl rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {isLoading ? 'Confirming...' : 'Confirm Your Vote'}
        </button>
      </div>
    </div>
  );
} 