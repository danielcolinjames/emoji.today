"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { PageLayout } from "@/components/PageLayout";
import { SelectEmoji } from "@/components/voting/SelectEmoji";
import { ConfirmEmoji } from "@/components/voting/ConfirmEmoji";
import { ReviewVote } from "@/components/voting/ReviewVote";
import { VotingResults } from "@/components/VotingResults";
import { VotingResultsScalable } from "@/components/VotingResultsScalable";
import { submitVote, getLiveVotingResults } from "@/lib/actions";
import { useFrame } from "@/components/providers/FrameProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from 'next/image';

type VotingStep = 'select' | 'confirm' | 'review' | 'results';

// Component for unauthenticated users
function UnauthenticatedVotePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between text-white bg-[#050505] pt-4 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-start flex-grow w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">

        {/* Top Text Block - Matching home page style */}
        <div className="text-center w-full mb-8 md:mb-10 lg:mb-20 mt-12 md:mt-20 lg:mt-24 flex flex-col">
          <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
            What emoji is today?
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-neutral-400 leading-tight font-light">
            To vote, you'll need a Farcaster account (for now).
          </p>
        </div>

        {/* Centered Vote Badge Container - Matching Emoji component size */}
        <div
          className="relative flex items-center justify-center w-full"
          style={{
            height: `300px`,
          }}
        >
          {/* Vote badge container with same styling as Emoji component */}
          <Image
            src="/images/voted-badge.svg"
            alt="Vote badge"
            width={300}
            height={300}
            style={{
              width: `300px`,
              height: `300px`,
              // borderWidth: `18px`,
              // borderRadius: '50%',
              // borderColor: '#FFFFFF',
              // borderStyle: 'solid',
              // backgroundColor: 'rgba(0, 0, 0, 1)',
              // overflow: 'hidden',
            }}
          >
            {/* <Image
              src="/images/vote-badge.svg"
              alt="Vote badge"
              width={150}
              height={150}
              style={{
                objectFit: 'contain',
              }}
            /> */}
          </Image>
        </div>

        {/* CTA Button - Matching home page style */}
        <div className="my-4 sm:my-12">
          <a
            href="https://farcaster.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-4 px-8 sm:py-5 sm:px-12 rounded-full text-2xl transition-all duration-300 w-full cursor-pointer bg-white text-black hover:bg-neutral-200"
          >
            <div className="flex items-center gap-3">
              <img
                src="/images/farcaster-white.svg"
                alt="Farcaster"
                className="h-4 w-4 sm:h-6 sm:w-6"
                style={{
                  filter: 'invert(1)'
                }}
              />
              <p className="text-base sm:text-lg md:text-xl text-center">
                Get Farcaster
              </p>
            </div>
          </a>

          <div className="mt-6 text-sm text-neutral-500 text-center max-w-[380px] mx-auto">
            <p>Already have Farcaster?</p>
            <p>Open this page in the Farcaster app to vote!</p>
          </div>
        </div>
      </main>

      {/* Footer - Matching home page style */}
      <footer className="flex flex-col items-center justify-center w-full py-4 md:py-6">
        <div className="flex space-x-6 md:space-x-4 items-center">
          <a href="https://farcaster.xyz/emojitoday" target="_blank" rel="noopener noreferrer">
            <img src="/images/farcaster-white.svg" alt="Farcaster" className="h-[26px] md:h-[24px] w-auto opacity-70 hover:opacity-100 transition-opacity" />
          </a>
          <a href="https://x.com/emoji_today" target="_blank" rel="noopener noreferrer">
            <img src="/images/x-white.svg" alt="X" className="h-[24px] md:h-[22px] opacity-70 hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </footer>
    </div>
  );
}

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
        // Store the user's vote emoji
        if (data.userVote) {
          setSelectedEmoji(data.userVote);
        }
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
        <VotingResultsScalable
          userVote={selectedEmoji || undefined}
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

export default function VotePageClient() {
  const { status } = useSession();

  // Show unauthenticated page if not logged in
  if (status === "unauthenticated") {
    return <UnauthenticatedVotePage />;
  }

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  // Show authenticated voting flow
  return (
    <AuthWrapper requireAuth>
      <VotePageContent />
    </AuthWrapper>
  );
} 