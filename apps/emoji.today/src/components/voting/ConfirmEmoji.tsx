"use client";

import { useState, useEffect } from "react";
import Emoji from "@/components/Emoji";
import { searchEmojis, type DatabaseEmoji } from "@/lib/emojis";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ConfirmEmojiProps {
  emoji: string;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

// Function to determine if text should be white or black based on background color
export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function ConfirmEmoji({ emoji, onConfirm, onBack, isLoading = false }: ConfirmEmojiProps) {
  const [emojiData, setEmojiData] = useState<DatabaseEmoji | null>(null);

  // Fetch emoji data to get filename and accent color
  useEffect(() => {
    const fetchEmojiData = async () => {
      const results = await searchEmojis(emoji);
      if (results.length > 0) {
        setEmojiData(results[0]);
      }
    };
    fetchEmojiData();
  }, [emoji]);

  const accentColor = emojiData?.accent_color || "#6B7280";
  const textColor = getContrastColor(accentColor);

  return (
    <div className="space-y-8">

      {/* Big Emoji Preview - exactly like home page with 300px container and 18px border */}
      <div className="flex justify-center py-8">
        {emojiData ? (
          <Emoji
            emoji={emojiData.emoji}
            filename={emojiData.filename}
            containerSize={300}
            borderWidth={18}
            accentColor={emojiData.accent_color}
          />
        ) : (
          // Show loading placeholder while fetching emoji data
          <div className="w-[300px] h-[300px] rounded-full bg-neutral-800 animate-pulse" />
        )}
      </div>

      {/* Confirm Button - full width, rounded-full, less thick */}
      <div className="px-4">
        <button
          onClick={onConfirm}
          disabled={isLoading || !emojiData}
          className="w-full px-8 py-3 font-medium text-lg rounded-full transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3"
          style={{
            backgroundColor: accentColor,
            color: textColor
          }}
        >
          {isLoading ? (
            <>
              <div style={{ filter: textColor === '#000000' ? 'invert(1)' : 'none' }}>
                <LoadingSpinner size={20} />
              </div>
              <span>Confirming...</span>
            </>
          ) : (
            'Confirm your vote'
          )}
        </button>
      </div>
    </div>
  );
} 