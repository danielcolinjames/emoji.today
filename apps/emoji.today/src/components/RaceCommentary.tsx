"use client";

import { useState, useEffect } from 'react';
import { generateRaceCommentary } from '@/actions/race-commentary';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Share2 } from 'lucide-react';

interface RaceCommentaryProps {
  className?: string;
  onGenerate?: (commentary: string) => void;
}

export function RaceCommentary({ className = "", onGenerate }: RaceCommentaryProps) {
  const [commentary, setCommentary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCommentary = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await generateRaceCommentary();

      if (result.success && result.commentary) {
        setCommentary(result.commentary);
        setLastUpdated(new Date());
        onGenerate?.(result.commentary);
      } else {
        setError(result.error || "Failed to generate commentary");
      }
    } catch (err) {
      setError("Failed to fetch race commentary");
      console.error("Commentary error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch commentary on mount
  useEffect(() => {
    fetchCommentary();
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  const handleShareToFarcaster = () => {
    if (!commentary) return;

    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`${commentary}\n\nVote now at emoji.today 🗳️`)}`;
    window.open(farcasterUrl, '_blank');
  };

  if (error && !commentary) {
    return (
      <div className={`bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-neutral-400 text-xs uppercase tracking-wider font-geist-mono">
              FARCASTER POST
            </span>
          </div>
          <button
            onClick={fetchCommentary}
            className="text-neutral-500 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-neutral-500 text-sm">Failed to load race commentary</p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-900/80 to-blue-800/50 border border-purple-700 rounded-2xl p-4 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`relative w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : 'bg-purple-400'}`}>
            {!isLoading && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-75"></div>
            )}
          </div>
          <span className="text-neutral-400 text-xs uppercase tracking-wider font-geist-mono">
            FARCASTER POST
          </span>
          {lastUpdated && (
            <span className="text-neutral-600 text-xs font-geist-mono">
              {formatTimeAgo(lastUpdated)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCommentary}
            className="text-neutral-500 hover:text-white transition-colors"
            disabled={isLoading}
            title="Refresh commentary"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleShareToFarcaster}
            className="text-neutral-500 hover:text-purple-400 transition-colors"
            disabled={!commentary}
            title="Share to Farcaster"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="min-h-[40px] flex items-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-400">
            <LoadingSpinner size={16} />
            <span className="text-sm">Generating Farcaster post...</span>
          </div>
        ) : commentary ? (
          <p className="text-white text-sm leading-relaxed font-medium">
            {commentary}
          </p>
        ) : (
          <p className="text-neutral-500 text-sm">Loading commentary...</p>
        )}
      </div>
    </div>
  );
} 