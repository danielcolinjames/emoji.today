"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { PageLayout } from "@/components/PageLayout";
import { SelectEmoji } from "@/components/voting/SelectEmoji";
import { ConfirmEmoji } from "@/components/voting/ConfirmEmoji";
import { ReviewVote } from "@/components/voting/ReviewVote";
import { VotingResults } from "@/components/VotingResults";
import { submitVote, getLiveVotingResults } from "@/lib/actions";
import { useFrame } from "@/components/providers/FrameProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

type VotingStep = 'select' | 'confirm' | 'review' | 'results';

function VotePageContent() {
  const { data: session, status } = useSession();
  const { context } = useFrame();
  const [step, setStep] = useState<VotingStep>('select');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitiallyChecked, setHasInitiallyChecked] = useState(false);

  // Only check voting status when user is authenticated
  useEffect(() => {
    // Don't re-check if we're in review step or if we've already checked
    if (step === 'review' || hasInitiallyChecked) {
      return;
    }

    if (status === "authenticated" && session?.user?.fid) {
      checkVotingStatus();
      setHasInitiallyChecked(true);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session, step, hasInitiallyChecked]);

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
        setHasVoted(false);
        setTotalVotes(0);
        setIsLoading(false);
        return;
      }

      const data = await getLiveVotingResults();
      if (data) {
        setHasVoted(true);
        setTotalVotes(data.totalVotes);
        // Don't jump straight to results if we haven't set it explicitly
        if (step === 'select') {
          setStep('results');
        }
      } else {
        setHasVoted(false);
        setTotalVotes(0);
        setStep('select');
      }
    } catch (error) {
      console.error('Error checking voting status:', error);
      setHasVoted(false);
      setTotalVotes(0);
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
      // After successful vote, update state and go to review step
      setHasVoted(true);
      setStep('review');
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

  const handleShareToFarcaster = () => {
    // This is called after the user clicks "Tell the world"
    // The actual sharing is handled in ReviewVote component
  };

  const handleViewResults = () => {
    // Simply move to results step - VotingResults will handle data fetching
    setStep('results');
  };

  const getPageTitle = () => {
    switch (step) {
      case 'select':
        return undefined;
      case 'confirm':
        return "Are you sure?";
      case 'review':
        return "Nice.";
      case 'results':
        return "The race is on!";
      default:
        return "What emoji is today?";
    }
  };

  const getPageSubtitle = () => {
    switch (step) {
      case 'select':
        return undefined;
      case 'confirm':
        return `Lock in your vote for ${new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`;
      case 'review':
        return "Now let's hope nothing crazy happens.";
      case 'results':
        if (hasVoted && totalVotes > 0) {
          const otherVoters = totalVotes - 1;
          if (otherVoters === 0) {
            return "You're the first voter today. Nice!";
          } else {
            return `You and ${otherVoters} other${otherVoters !== 1 ? 's' : ''} did your civic duty.`;
          }
        }
        return "Loading results...";
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
      ) : step === 'results' ? (
        <VotingResults
          userProfileUrl={context?.user?.pfpUrl}
        />
      ) : step === 'review' && selectedEmoji ? (
        <ReviewVote
          emoji={selectedEmoji}
          onShareToFarcaster={handleShareToFarcaster}
          onViewResults={handleViewResults}
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