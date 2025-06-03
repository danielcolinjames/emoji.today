"use client";

import { useState, useEffect } from 'react';

interface TickerHeadline {
  id: string;
  content: string;
  priority: number;
  created_at: string;
  context: {
    leading_emoji?: string;
    vote_count?: number;
    time_remaining?: string;
  };
}

interface TickerResponse {
  success: boolean;
  content: TickerHeadline[];
  count: number;
  generated_at: string;
}

export function LiveTicker() {
  const [headlines, setHeadlines] = useState<TickerHeadline[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickerContent = async () => {
    try {
      const response = await fetch('/api/ticker');
      if (!response.ok) {
        throw new Error('Failed to fetch ticker content');
      }

      const data: TickerResponse = await response.json();
      if (data.success && data.content.length > 0) {
        setHeadlines(data.content);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching ticker:', err);
      setError('Failed to load news ticker');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ticker content on mount and refresh every 30 seconds
  useEffect(() => {
    fetchTickerContent();
    const interval = setInterval(fetchTickerContent, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through headlines every 4 seconds
  useEffect(() => {
    if (headlines.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [headlines.length]);

  if (error) {
    return (
      <div className="bg-red-900/20 border-l-4 border-red-500 text-red-100 p-2 text-sm">
        <span className="font-mono">⚠️ {error}</span>
      </div>
    );
  }

  if (isLoading || headlines.length === 0) {
    return (
      <div className="bg-neutral-900 border-b border-neutral-800 p-2">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="font-mono font-bold text-yellow-400">LIVE</span>
          </div>
          <span className="animate-pulse">Loading latest updates...</span>
        </div>
      </div>
    );
  }

  const currentHeadline = headlines[currentIndex];

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 overflow-hidden">
      <div className="flex items-center gap-3 p-2 text-sm">
        {/* Live indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="font-mono font-bold text-red-400">LIVE</span>
        </div>

        {/* Ticker content with smooth transitions */}
        <div className="flex-1 overflow-hidden">
          <div
            className="transition-all duration-500 ease-in-out transform"
            key={currentHeadline.id}
          >
            <span className="text-white font-medium animate-slideIn">
              {currentHeadline.content}
            </span>
          </div>
        </div>

        {/* Dots indicator for multiple headlines */}
        {headlines.length > 1 && (
          <div className="flex gap-1 flex-shrink-0">
            {headlines.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-1 rounded-full transition-colors duration-300 ${index === currentIndex ? 'bg-white' : 'bg-neutral-600'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
} 