"use client";

import { useState, useEffect } from "react";
import { AuthWrapper } from "~/components/AuthWrapper";
import { VotingInterface } from "~/components/VotingInterface";
import { VoteConfirmation } from "~/components/VoteConfirmation";
import { VotingResults } from "~/components/VotingResults";
import { submitVote, getVotingResults } from "~/lib/actions";

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

export default function VotePage() {
  const [step, setStep] = useState<VotingStep>('select');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [results, setResults] = useState<VotingResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has already voted today
  useEffect(() => {
    checkVotingStatus();
  }, []);

  const checkVotingStatus = async () => {
    try {
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

  return (
    <AuthWrapper requireAuth>
      <div className="bg-[#050505]">
        <div className="max-w-2xl mx-auto p-6 pt-8">
          <h1 className="text-4xl font-bold mb-8 text-center tracking-branded text-white">
            {getPageTitle()}
          </h1>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setStep('select');
                }}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Try again
              </button>
            </div>
          ) : step === 'results' && results ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <VotingResults
                results={results.results}
                totalVotes={results.totalVotes}
                userVote={results.userVote}
                voteDate={results.voteDate}
              />
            </div>
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
    </AuthWrapper>
  );
} 