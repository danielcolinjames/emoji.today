"use client";

import { DEFAULT_OPENING_CHYRON } from '@/lib/constants';
import { useState, useEffect, useRef } from 'react';

interface RaceChyronProps {
  className?: string;
}

export function RaceChyron({ className = "" }: RaceChyronProps) {
  const [chyronText, setChyronText] = useState<string>(DEFAULT_OPENING_CHYRON);
  const [nextChyronText, setNextChyronText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(15);
  const textRef = useRef<HTMLSpanElement>(null);

  // Add gap between chyron runs
  const [showGap, setShowGap] = useState(false);

  const fetchChyronUpdate = async () => {
    if (isLoading) return; // Prevent multiple simultaneous requests

    setIsLoading(true);
    try {
      // Fetch race update from API
      const response = await fetch('/api/chyron');
      const result = await response.json();

      if (result.success && result.chyron) {
        const newText = result.chyron;
        console.log('📺 Chyron: Fetched race update from API');

        // If text is different, queue it for next cycle
        if (newText !== chyronText) {
          setNextChyronText(newText);
          console.log('📺 Chyron: Queued new text for next cycle');
        } else {
          console.log('📺 Chyron: Text unchanged');
        }
      } else {
        console.log('📺 Chyron: API failed, using default');
        setNextChyronText(DEFAULT_OPENING_CHYRON);
      }
    } catch (err) {
      console.error("Chyron update error:", err);
      setNextChyronText(DEFAULT_OPENING_CHYRON);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate animation duration based on text length
  const calculateAnimationDuration = () => {
    if (!textRef.current) return 15;

    const textWidth = textRef.current.scrollWidth;
    const screenWidth = window.innerWidth;
    const totalDistance = screenWidth + textWidth; // From right edge to completely off left edge

    // Speed in pixels per second - adjust this value to make it faster/slower
    const speed = 120;

    const duration = totalDistance / speed;
    return Math.max(duration, 8); // Minimum 8 seconds for very short text
  };

  // Update animation duration when text changes
  useEffect(() => {
    const updateDuration = () => {
      const newDuration = calculateAnimationDuration();
      setAnimationDuration(newDuration);
    };

    // Small delay to ensure text is rendered
    const timer = setTimeout(updateDuration, 100);
    return () => clearTimeout(timer);
  }, [chyronText]);

  // Update to next text when animation completes, with gap
  const handleAnimationIteration = () => {
    if (nextChyronText && nextChyronText !== chyronText) {
      // Start gap period
      setShowGap(true);

      // After gap, show new text
      setTimeout(() => {
        setChyronText(nextChyronText);
        setNextChyronText(null);
        setShowGap(false);
        console.log('📺 Chyron: Updated to queued text after gap');
      }, 3000); // 3 second gap
    }
  };

  // Fetch chyron update on mount
  useEffect(() => {
    fetchChyronUpdate();
  }, []);

  // Auto-refresh every 5 minutes since we only show race updates now
  useEffect(() => {
    const interval = setInterval(fetchChyronUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (showGap) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 h-14 overflow-hidden border-t border-neutral-800 z-50 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-neutral-900 to-black" />
        <div className="relative z-10 h-full flex items-center justify-center pb-2">
          <span className="text-white text-xs font-bold tracking-wide font-mono opacity-50">
            • • •
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-14 overflow-hidden border-t border-neutral-800 z-50 ${className}`}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-black to-neutral-900/80" />

      {/* Scrolling Text Container */}
      <div className="relative z-10 left-0 top-0 h-full flex items-center pb-2">
        <div
          className="animate-scroll-left whitespace-nowrap"
          onAnimationIteration={handleAnimationIteration}
          style={{
            animationDuration: `${animationDuration}s`
          }}
        >
          <span
            ref={textRef}
            className="text-white/50 text-lg tracking-widest font-mono grayscale-50"
          >
            {chyronText}
          </span>
        </div>
      </div>

      {/* CSS for scrolling animation - ensures full exit */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(calc(-100% - 50px));
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left linear infinite;
        }
      `}</style>
    </div>
  );
} 