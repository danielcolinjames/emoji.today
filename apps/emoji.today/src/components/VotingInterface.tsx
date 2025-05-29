"use client";

import { useState } from "react";

interface EmojiOption {
  emoji: string;
  name: string;
  accentColor: string;
}

const emojiOptions: EmojiOption[] = [
  { emoji: "🙂", name: "Happy", accentColor: "#FFC107" },
  { emoji: "🌱", name: "Growth", accentColor: "#4CAF50" },
  { emoji: "💦", name: "Flow", accentColor: "#2196F3" },
  { emoji: "🔥", name: "Energy", accentColor: "#FF5722" },
];

interface VotingInterfaceProps {
  onContinue: (emoji: string) => void;
  isLoading?: boolean;
}

export function VotingInterface({ onContinue, isLoading = false }: VotingInterfaceProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const selectedOption = emojiOptions.find(option => option.emoji === selectedEmoji);

  const handleContinue = () => {
    if (!selectedEmoji) return;
    onContinue(selectedEmoji);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-center mb-8">
        What happened today? When humans in 2125 look back,
        will they think we picked the right one?
      </p>

      {/* Emoji Selection Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {emojiOptions.map((option) => (
          <button
            key={option.emoji}
            onClick={() => setSelectedEmoji(option.emoji)}
            disabled={isLoading}
            className={`
              p-6 rounded-lg border-2 transition-all duration-200 
              hover:scale-105 active:scale-95 
              ${selectedEmoji === option.emoji
                ? 'border-2 bg-gray-800 shadow-lg'
                : 'border-gray-600 hover:border-gray-500 bg-gray-800'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              borderColor: selectedEmoji === option.emoji ? option.accentColor : undefined,
              backgroundColor: selectedEmoji === option.emoji ? `${option.accentColor}20` : undefined,
            }}
          >
            <div className="text-4xl mb-2">{option.emoji}</div>
            <div className="text-sm font-medium text-gray-300">{option.name}</div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      {selectedEmoji && (
        <div className="text-center animate-fadeIn">
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="px-8 py-3 text-white font-semibold rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: selectedOption?.accentColor,
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
} 