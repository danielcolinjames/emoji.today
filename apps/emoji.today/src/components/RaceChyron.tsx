"use client";

import { useState, useEffect } from 'react';

interface RaceChyronProps {
  className?: string;
}

export function RaceChyron({ className = "" }: RaceChyronProps) {
  const [chyronText, setChyronText] = useState<string>("POLLS OPEN • CAST YOUR VOTE AT EMOJI.TODAY");
  const [isLoading, setIsLoading] = useState(false);

  const fetchChyronUpdate = async () => {
    if (isLoading) return; // Prevent multiple simultaneous requests

    setIsLoading(true);
    try {
      const response = await fetch('/api/chyron');
      const result = await response.json();

      if (result.success && result.chyron) {
        setChyronText(result.chyron);

        // Log cache status for debugging
        if (result.cached) {
          console.log('📺 Chyron: Using cached result');
        } else {
          console.log('📺 Chyron: Generated fresh result');
        }
      }
    } catch (err) {
      console.error("Chyron update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chyron update on mount
  useEffect(() => {
    fetchChyronUpdate();
  }, []);

  // Auto-refresh every 60 seconds (reduced since server caches intelligently)
  useEffect(() => {
    const interval = setInterval(fetchChyronUpdate, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-14 overflow-hidden bg-black border-t border-neutral-800 z-50 ${className}`}>
      {/* Scrolling Text Container */}
      <div className="absolute left-14 top-0 h-full flex items-center pb-2">
        <div className="animate-scroll-left whitespace-nowrap">
          <span
            className="text-white text-xs font-bold tracking-wide"
            style={{ fontFamily: 'Sixtyfour Convergence, monospace' }}
          >
            {chyronText}
          </span>
        </div>
      </div>

      {/* CSS for scrolling animation */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 15s linear infinite;
        }
        
        /* Slower animation when text is very long */
        .animate-scroll-left:has(> span:is([data-long])) {
          animation-duration: 20s;
        }
      `}</style>
    </div>
  );
} 