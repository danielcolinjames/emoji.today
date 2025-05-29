"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { PageLayout } from "@/components/PageLayout";
import { SelectEmoji } from "@/components/voting/SelectEmoji";
import { ConfirmEmoji } from "@/components/voting/ConfirmEmoji";
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
      // Check multiple ways to identify the testing user
      const isTestUser =
        context?.user?.username === "emojitoday" ||
        session?.user?.fid === 1234 || // Replace with your actual FID
        (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      if (isTestUser) {
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
      // Pass username and displayName from Frame context to track user info
      await submitVote(
        selectedEmoji,
        context?.user?.username,
        context?.user?.displayName
      );
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
    switch (step) {
      case 'select':
        return undefined;
      case 'confirm':
        return "Confirm your vote";
      case 'results':
        return "You've voted";
      default:
        return "What emoji is today?";
    }
  };

  const getPageSubtitle = () => {
    switch (step) {
      case 'select':
        return undefined;
      case 'confirm':
        return "This is your moment to make history.";
      case 'results':
        return new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }).toUpperCase();
      default:
        return undefined;
    }
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
    <PageLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      showBackButton={step === 'confirm'}
      onBack={step === 'confirm' ? handleBackToSelect : undefined}
    >
      {error ? (
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl mb-8">
          <p className="text-lg text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setStep('select');
            }}
            className="text-red-400 hover:text-red-300 underline text-lg"
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
        <ConfirmEmoji
          emoji={selectedEmoji}
          onConfirm={handleConfirmVote}
          onBack={handleBackToSelect}
          isLoading={isSubmitting}
        />
      ) : (
        <SelectEmoji onContinue={handleContinueToConfirm} />
      )}
    </PageLayout>
  );
}

export default function VotePage() {
  return (
    <AuthWrapper requireAuth>
      <VotePageContent />
    </AuthWrapper>
  );
} 