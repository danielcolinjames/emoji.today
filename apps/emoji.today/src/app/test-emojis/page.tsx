"use client";

import { useEffect, useState } from "react";
import Emoji from "@/components/Emoji";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getRandomEmojis, type DatabaseEmoji } from "@/lib/emojis";

export default function TestEmojis() {
  const [emojis, setEmojis] = useState<DatabaseEmoji[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emojiSize, setEmojiSize] = useState(200); // Default to 200px

  // Loading is true if either data hasn't loaded OR minimum time hasn't elapsed
  const loading = !dataLoaded || !minTimeElapsed;

  useEffect(() => {
    const loadEmojis = async () => {
      try {
        // Get a large number of emojis to show as many as possible
        const emojiData = await getRandomEmojis(500);
        setEmojis(emojiData);
        setDataLoaded(true);
      } catch (err) {
        setError("Failed to load emojis");
        console.error("Error loading emojis:", err);
        setDataLoaded(true); // Set to true even on error to stop loading
      }
    };

    // Start minimum time timer
    const minTimeTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 500); // 0.5 seconds minimum

    loadEmojis();

    return () => clearTimeout(minTimeTimer);
  }, []);

  // Calculate border width proportional to size (but with reasonable bounds)
  const borderWidth = Math.max(2, Math.min(30, Math.floor(emojiSize * 0.05)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <div className="text-2xl text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Size Slider */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-800 rounded-full py-4 px-8 shadow-lg border border-neutral-700">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 w-12">50px</span>
          <input
            type="range"
            min="50"
            max="1000"
            value={emojiSize}
            onChange={(e) => setEmojiSize(parseInt(e.target.value))}
            className="w-64 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
          />
          <span className="text-sm text-gray-300 w-16">1000px</span>
          <span className="text-sm text-white font-medium w-16 text-center">{emojiSize}px</span>
        </div>
      </div>

      <div className="container mx-auto pt-20">
        {/* Grid of emojis with no gaps */}
        <div className="flex flex-wrap justify-center">
          {emojis.map((emoji, index) => (
            <div
              key={`${emoji.emoji}-${index}`}
              className="flex items-center justify-center"
              style={{ width: `${emojiSize}px`, height: `${emojiSize}px` }}
            >
              <Emoji
                emoji={emoji.emoji}
                filename={emoji.filename}
                containerSize={emojiSize}
                borderWidth={borderWidth}
                accentColor={emoji.accent_color}
              />
            </div>
          ))}
        </div>

        {emojis.length === 0 && (
          <div className="text-center text-neutral-400 mt-12">
            No emojis found in the database.
          </div>
        )}
      </div>
    </div>
  );
} 