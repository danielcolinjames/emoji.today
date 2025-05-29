"use client";

import { useState, useEffect } from "react";
import Emoji from "@/components/Emoji";
import { searchEmojis, type DatabaseEmoji } from "@/lib/emojis";
import { ArrowRight } from "lucide-react";

interface ReviewVoteProps {
  emoji: string;
  onShareToFarcaster: () => void;
  onViewResults: () => void;
}

// Function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function ReviewVote({ emoji, onShareToFarcaster, onViewResults }: ReviewVoteProps) {
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

  const handleShare = () => {
    // Create the share text and URL
    const shareText = `Just voted for ${emoji} to be the emoji.today`;

    // Farcaster compose URL with pre-filled text
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareText)}`;

    // Open in new window
    window.open(farcasterUrl, '_blank');

    // Call the callback as well
    onShareToFarcaster();
  };

  return (
    <div className="space-y-8">

      {/* Big Emoji Preview - exactly like confirm page with 300px container and 18px border */}
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

      {/* Action Buttons */}
      <div className="space-y-4 px-4">
        {/* Primary CTA - Tell the world */}
        <button
          onClick={handleShare}
          className="w-full px-8 py-3 font-medium text-lg rounded-full transition-all duration-200"
          style={{
            backgroundColor: accentColor,
            color: textColor
          }}
        >
          Tell the world
        </button>

        {/* Secondary CTA - View results */}
        <button
          onClick={onViewResults}
          className="w-full px-8 py-3 font-medium text-lg rounded-full transition-all duration-200 bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center gap-2"
        >
          View results
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 