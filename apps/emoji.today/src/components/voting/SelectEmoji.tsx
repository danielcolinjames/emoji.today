"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { getRandomEmojis, searchEmojis, type DatabaseEmoji } from "@/lib/emojis";
import Emoji from "@/components/Emoji";
import { getContrastTextColor } from "@/lib/utils";

interface SelectEmojiProps {
  onContinue: (emoji: string) => void;
  isLoading?: boolean;
}

export function SelectEmoji({ onContinue, isLoading = false }: SelectEmojiProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<DatabaseEmoji | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [emojis, setEmojis] = useState<DatabaseEmoji[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load initial random emojis - but don't set them until user types
  useEffect(() => {
    // Auto-focus search input after a small delay to ensure component is mounted
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadRandomEmojis = async () => {
    const randomEmojis = await getRandomEmojis(50);
    return randomEmojis;
  };

  // Handle search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        setHasSearched(true);

        // Search for emojis
        const results = await searchEmojis(searchQuery.trim());

        // If still no results, show random emojis
        if (results.length === 0) {
          const randomResults = await loadRandomEmojis();
          setEmojis(randomResults);
        } else {
          setEmojis(results);

          // Auto-select if only one result
          if (results.length === 1) {
            setSelectedEmoji(results[0]);
          }
        }

        setIsSearching(false);
      } else {
        // Clear results when search is empty
        setEmojis([]);
        setHasSearched(false);
        setSelectedEmoji(null);
      }
    }, 300); // Debounce delay

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleContinue = () => {
    if (!selectedEmoji) return;
    onContinue(selectedEmoji.emoji);
  };

  // Handle infinite scroll
  const handleScroll = async () => {
    if (!scrollContainerRef.current || !hasSearched || searchQuery.trim()) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 100;

    if (isNearEnd && !isSearching) {
      const moreEmojis = await loadRandomEmojis();
      setEmojis(prev => [...prev, ...moreEmojis]);
    }
  };

  return (
    <div className="w-full">
      {/* Title and subtitle - exactly matching homepage spacing */}
      <div className="text-center w-full mb-4 md:mb-8 lg:mb-20 mt-12 md:mt-20 lg:mt-24 flex flex-col">
        <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
          What emoji is today?
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-neutral-400 leading-tight font-light">
          Pick wisely. There&apos;s only one today.
        </p>
      </div>



      {/* Search Input and Continue Button - horizontal split */}
      <div className="flex gap-4 w-full items-center">
        {/* Search Input - 2/3 width */}
        <div className="relative flex-grow">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search emojis..."
            className="w-full px-4 py-2 text-white text-lg bg-neutral-800/50 border border-neutral-700 rounded-full focus:outline-none focus:border-neutral-700 transition-colors"
            style={{ fontSize: '16px' }}
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Continue Button - 1/3 width, just arrow */}
        <button
          onClick={handleContinue}
          disabled={!selectedEmoji || isLoading}
          className={`
            h-[45px] w-[45px] rounded-full
            transition-all duration-300 
            flex items-center justify-center
            ${selectedEmoji
              ? ''
              : 'opacity-50 cursor-not-allowed bg-neutral-700'
            }
          `}
          style={{
            backgroundColor: selectedEmoji?.accent_color || '#404040',
            color: selectedEmoji ? getContrastTextColor(selectedEmoji.accent_color) : '#9CA3AF',
          }}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Horizontal Emoji Scroll - only show after typing */}
      {hasSearched && emojis.length > 0 && (
        <div className="mb-4">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`overflow-x-auto scrollbar-hide ${emojis.length <= 2 ? 'flex justify-center' : ''
              }`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className={`flex gap-3 ${emojis.length <= 2 ? '-ml-4 px-4' : 'pr-0'
              }`}>
              {emojis.map((emojiData, index) => (
                <button
                  key={`${emojiData.emoji}-${index}`}
                  onClick={() => setSelectedEmoji(emojiData)}
                  disabled={isLoading}
                  className={`
                    flex-shrink-0 text-2xl p-3 rounded-xl transition-all duration-300
                    ${selectedEmoji?.emoji === emojiData.emoji
                    && 'z-10'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  style={{
                    filter: !selectedEmoji || selectedEmoji.emoji !== emojiData.emoji ? 'grayscale(100%)' : 'none',
                    opacity: !selectedEmoji || selectedEmoji.emoji !== emojiData.emoji ? 0.5 : 1,
                  }}
                >
                  {emojiData.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add global styles for scrollbar hiding */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 