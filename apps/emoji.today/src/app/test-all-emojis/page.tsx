"use client";

import { getAllEmojis, getEmojiImageUrl } from "@/lib/emojis";
import Image from "next/image";
import { useState } from "react";

export default function TestAllEmojis() {
  const [showCount, setShowCount] = useState(100);
  const allEmojis = getAllEmojis();
  const displayEmojis = allEmojis.slice(0, showCount);

  return (
    <div className="p-8 bg-black">
      <div className="text-white mb-6">
        <h1 className="text-3xl font-bold mb-4">All Emojis Test - Full Coverage! 🎉</h1>
        <p className="text-lg mb-2">Total emojis available: {allEmojis.length}</p>
        <p className="text-lg mb-4">Currently showing: {displayEmojis.length}</p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCount(Math.min(showCount + 100, allEmojis.length))}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            disabled={showCount >= allEmojis.length}
          >
            Load 100 More
          </button>
          <button
            onClick={() => setShowCount(allEmojis.length)}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
            disabled={showCount >= allEmojis.length}
          >
            Load All {allEmojis.length}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {displayEmojis.map((emoji, index) => {
          const url = getEmojiImageUrl(emoji);
          return (
            <div key={`${emoji}-${index}`} className="bg-gray-900 p-2 rounded flex flex-col items-center">
              <div className="text-white text-xs mb-1">{emoji}</div>
              {url && (
                <div className="relative w-16 h-16">
                  <Image
                    src={url}
                    alt={emoji}
                    fill
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      console.error(`Failed to load: ${emoji} at ${url}`);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCount < allEmojis.length && (
        <div className="text-white text-center mt-8">
          <p className="text-lg">Showing {showCount} of {allEmojis.length} emojis</p>
        </div>
      )}
    </div>
  );
} 