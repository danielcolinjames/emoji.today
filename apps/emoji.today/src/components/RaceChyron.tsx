"use client";

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_OPENING_CHYRON } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface RaceChyronProps {
  className?: string;
}

function toUpperCase(text: string): string {
  return text.toUpperCase()
}

export function RaceChyron({ className = "" }: RaceChyronProps) {
  const [chyronText, setChyronText] = useState<string>(DEFAULT_OPENING_CHYRON.toUpperCase());
  const [animationDuration, setAnimationDuration] = useState(15);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchCurrentChyron = async () => {
    try {
      const response = await fetch('/api/chyron');
      const result = await response.json();

      if (result.success && result.chyron && result.chyron !== chyronText) {
        setChyronText(result.chyron);
      }
    } catch (error) {
      console.error("Error fetching current chyron:", error);
    }
  };

  // Calculate animation duration based on text length
  const calculateAnimationDuration = () => {
    if (!textRef.current || !containerRef.current) return 15;

    // Create a temporary element to measure text width accurately
    const tempElement = document.createElement('span');
    tempElement.style.cssText = `
      font-family: 'Geist Mono', monospace;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      white-space: nowrap;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `;
    tempElement.textContent = chyronText;
    document.body.appendChild(tempElement);

    const textWidth = tempElement.getBoundingClientRect().width;
    document.body.removeChild(tempElement);

    const containerWidth = containerRef.current.getBoundingClientRect().width;

    // Total distance: text starts 100px right of container, ends 100px left of container
    const startPosition = containerWidth + 100;
    const endPosition = -textWidth - 100;
    const totalDistance = startPosition - endPosition;

    // Fixed speed: 100 pixels per second
    const speed = 100;
    const duration = totalDistance / speed;

    console.log('Chyron calculation:', {
      textWidth,
      containerWidth,
      totalDistance,
      duration: duration.toFixed(2) + 's'
    });

    return Math.max(duration, 8); // Minimum 8 seconds
  };

  // Update animation duration when text changes
  useEffect(() => {
    const updateDuration = () => {
      const newDuration = calculateAnimationDuration();
      setAnimationDuration(newDuration);
    };

    // Small delay to ensure DOM is ready and fonts are loaded
    const timer = setTimeout(updateDuration, 200);

    // Also update on window resize
    const handleResize = () => updateDuration();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [chyronText]);

  // Fetch initial chyron & set up realtime subscription
  useEffect(() => {
    let cancelled = false;

    // 1) initial fetch (so we render something ASAP)
    fetchCurrentChyron();

    // 2) subscribe to updates from the chyrons table
    const channel = supabase
      .channel('public:chyrons')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chyrons' },
        (payload) => {
          if (cancelled) return;
          const newText = (payload.new as any)?.text as string | undefined;
          if (newText) {
            setChyronText((prev) => {
              const upper = newText.toUpperCase();
              return prev === upper ? prev : upper;
            });
          }
        }
      )
      .subscribe();

    // 3) ultra-light fallback: poll every 5 min in case websocket drops
    const fallbackInterval = setInterval(fetchCurrentChyron, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-0 left-0 right-0 h-14 overflow-hidden border-t border-neutral-900 backdrop-blur-md z-50 ${className}`}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black/80 to-neutral-900" />

      {/* Scrolling Text Container */}
      <div className="relative z-10 left-0 top-0 h-full flex items-center pb-2">
        <div
          className="animate-scroll-left whitespace-nowrap"
          style={{
            animationDuration: `${animationDuration}s`
          }}
        >
          <span
            ref={textRef}
            className="text-neutral-200 text-xs tracking-widest font-geist-mono"
          >
            {chyronText}
          </span>
        </div>
      </div>

      {/* CSS for scrolling animation */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(calc(100vw + 100px));
          }
          100% {
            transform: translateX(calc(-100% - 100px));
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
} 