"use client";

import { useState, useEffect } from "react";
import Emoji from "@/components/Emoji";
import { searchEmojis, type DatabaseEmoji } from "@/lib/emojis";
import { ArrowRight, Copy, CheckCircle } from "lucide-react";
import { MintVoteButton } from "../MintVoteButton";

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
  const [copied, setCopied] = useState(false);

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

  // Get current date for sharing
  const currentDate = new Date().toISOString().split('T')[0];

  // Create share URLs with all necessary parameters
  const shareUrl = `https://emoji.today/share?emoji=${encodeURIComponent(emoji)}&date=${currentDate}&accentColor=${encodeURIComponent(accentColor)}`;

  const handleFarcasterShare = () => {
    const castText = `Just voted ${emoji} for ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })} on emoji.today`;

    // Farcaster compose URL with pre-filled text and embedded frame
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
    window.open(farcasterUrl, '_blank');

    // Call the callback as well
    onShareToFarcaster();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

      {/* Share Section */}
      <div className="space-y-6 px-4">
        {/* Share Buttons - Using same style as VotingResults component */}
        <div className="flex flex-row items-center justify-center gap-4">
          {/* Farcaster Share */}
          <button
            onClick={handleFarcasterShare}
            className="bg-black text-white border border-white/20 font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-white/10"
            title="Share on Farcaster"
          >
            <img src="/images/farcaster-white.svg" alt="Farcaster" className="max-w-[18px] max-h-[18px]" />
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyToClipboard}
            className="bg-black text-white border border-white/20 font-semibold py-2 px-4 rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-white/10"
            title="Copy share link"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mint Your Vote Button */}
        <div className="border-t border-neutral-800 pt-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Make it permanent</h3>
            <p className="text-neutral-400 text-sm">Mint your vote as an NFT to commemorate this moment</p>
          </div>
          <MintVoteButton
            emoji={emoji}
            date={currentDate}
            className="mt-4"
          />
        </div>

        {/* View Results Button */}
        <button
          onClick={onViewResults}
          className="w-full px-8 py-3 font-medium text-lg rounded-full transition-all duration-200 bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center gap-2 mt-6"
        >
          View results
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 