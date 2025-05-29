"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { VotingInterface } from "@/components/VotingInterface";
import { VoteConfirmation } from "@/components/VoteConfirmation";
import { VotingResults } from "@/components/VotingResults";
import { submitVote, getVotingResults } from "@/lib/actions";
import { useFrame } from "@/components/providers/FrameProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EmojiVoteCount {
  emoji: string;
  count: number;
  percentage: number;
}

interface VotingResultsData {
  results: EmojiVoteCount[];
  totalVotes: number;
  userVote: string;
  voteDate: string;
}

type VotingStep = 'select' | 'confirm' | 'results';

function VotePageContent() {
  const { data: session, status } = useSession();
  const { context } = useFrame();
  const [step, setStep] = useState<VotingStep>('select');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [results, setResults] = useState<VotingResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only check voting status when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.fid) {
      checkVotingStatus();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session]);

  const checkVotingStatus = async () => {
    try {
      // Testing override: if username is "emojitoday", always allow fresh voting
      console.log('Debug - context:', context);
      console.log('Debug - context.user:', context?.user);
      console.log('Debug - username:', context?.user?.username);
      console.log('Debug - session:', session);
      console.log('Debug - session.user.fid:', session?.user?.fid);

      // Check multiple ways to identify the testing user
      const isTestUser =
        context?.user?.username === "emojitoday" ||
        session?.user?.fid === 1234 || // Replace with your actual FID
        (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      if (isTestUser) {
        console.log('Debug - Testing override activated');
        setStep('select');
        setIsLoading(false);
        return;
      }

      const data = await getVotingResults();
      if (data) {
        setResults(data);
        setStep('results');
      } else {
        setStep('select');
      }
    } catch (error) {
      console.error('Error checking voting status:', error);
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToConfirm = (emoji: string) => {
    setSelectedEmoji(emoji);
    setStep('confirm');
  };

  const handleConfirmVote = async () => {
    if (!selectedEmoji) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitVote(selectedEmoji);
      // After successful vote, fetch results
      await checkVotingStatus();
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSelect = () => {
    setSelectedEmoji(null);
    setStep('select');
  };

  const getPageTitle = () => {
    if (step === 'results') {
      return "You've voted";
    }
    return "What emoji is today?";
  };

  // Show loading while checking auth status
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#050505] text-white">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <div className="bg-[#050505]">
      <div className="max-w-2xl mx-auto p-6 pt-20">
        {/* Only show title for non-results steps */}
        {step !== 'results' && (
          <h1 className="text-4xl font-bold mb-8 text-center tracking-branded text-white">
            {getPageTitle()}
          </h1>
        )}

        {error ? (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg mb-6">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setStep('select');
              }}
              className="mt-2 text-red-400 hover:text-red-300 underline text-sm"
            >
              Try again
            </button>
          </div>
        ) : step === 'results' && results ? (
          <VotingResults
            results={results.results}
            totalVotes={results.totalVotes}
            userVote={results.userVote}
            voteDate={results.voteDate}
          />
        ) : step === 'confirm' && selectedEmoji ? (
          <VoteConfirmation
            emoji={selectedEmoji}
            onConfirm={handleConfirmVote}
            onBack={handleBackToSelect}
            isLoading={isSubmitting}
          />
        ) : (
          <VotingInterface onContinue={handleContinueToConfirm} />
        )}
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <AuthWrapper requireAuth>
      <VotePageContent />
    </AuthWrapper>
  );
} 