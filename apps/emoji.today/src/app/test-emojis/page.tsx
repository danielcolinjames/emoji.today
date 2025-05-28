"use client";

import { getCuratedEmojis, getEmojiImageUrl } from "@/lib/emojis";
import Image from "next/image";

export default function TestEmojis() {
  const emojis = getCuratedEmojis().slice(0, 20); // First 20 emojis

  return (
    <div className="p-8 bg-black min-h-screen">
      <h1 className="text-white text-2xl mb-4">Emoji Test Page</h1>
      <div className="grid grid-cols-5 gap-4">
        {emojis.map((emoji) => {
          const url = getEmojiImageUrl(emoji);
          return (
            <div key={emoji} className="bg-gray-800 p-4 rounded">
              <p className="text-white text-center mb-2">{emoji}</p>
              {url && (
                <div className="relative w-32 h-32 mx-auto">
                  <Image
                    src={url}
                    alt={emoji}
                    fill
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      console.error(`Failed to load: ${url}`);
                    }}
                  />
                </div>
              )}
              <p className="text-gray-400 text-xs mt-2 break-all">{url}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
} 