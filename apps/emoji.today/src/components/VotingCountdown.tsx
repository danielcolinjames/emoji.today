"use client";

import { useState, useEffect } from "react";
import { getRemainingTimeToMidnightUTC, formatCountdown } from "@/lib/utils";

interface VotingCountdownProps {
  verbose?: boolean;
}

export function VotingCountdown({ verbose = false }: VotingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(getRemainingTimeToMidnightUTC());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getRemainingTimeToMidnightUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center text-sm sm:text-base md:text-lg text-neutral-600 font-geist-mono">
      {formatCountdown(timeRemaining, verbose)}
    </div>
  );
} 