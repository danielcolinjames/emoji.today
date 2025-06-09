import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Link from 'next/link';
import { getUserProfile, getLiveVotingResults } from '@/lib/actions';
import { getCurrentVotingDateString } from '@/lib/date-utils';
import Emoji from '@/components/Emoji';
import { ProfilePicture } from '@/components/ProfilePicture';
import { getSession } from "@/auth";
import { redirect } from 'next/navigation';

async function getProfileData() {
  try {
    const session = await getSession();
    if (!session?.user?.fid) {
      redirect('/');
    }

    const profile = await getUserProfile();

    // Get today's live results to check if user's vote is currently winning
    let todaysLiveResults = null;
    try {
      todaysLiveResults = await getLiveVotingResults();
    } catch (error) {
      console.error('Error fetching live results:', error);
    }

    return { profile, todaysLiveResults };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    redirect('/');
  }
}

export default async function ProfilePage() {
  const { profile, todaysLiveResults } = await getProfileData();
  const today = getCurrentVotingDateString();

  // Helper function to check if user's emoji is currently winning today
  const isCurrentlyWinning = (userEmoji: string): boolean => {
    if (!todaysLiveResults?.results || todaysLiveResults.results.length === 0) {
      return false;
    }

    const sortedResults = [...todaysLiveResults.results].sort((a, b) => b.count - a.count);
    const topEmoji = sortedResults[0];

    // Handle emoji variation selector normalization
    const normalizeEmoji = (emoji: string) => emoji.replace(/\uFE0F/g, "");
    return topEmoji.emoji === userEmoji ||
      normalizeEmoji(topEmoji.emoji) === normalizeEmoji(userEmoji);
  };

  const formatDateParts = (dateString: string) => {
    // Parse the date as UTC
    const date = new Date(dateString + 'T00:00:00.000Z');
    const utcDate = toZonedTime(date, 'UTC');

    return {
      month: format(utcDate, 'MMM').toUpperCase(),
      day: format(utcDate, 'd'),
      year: format(utcDate, 'yyyy')
    };
  };

  const emojiSize = 80; // Smaller size for profile history
  const emojiSizeDesktop = 120; // Desktop size for profile history
  const borderWidth = Math.round(emojiSize * 0.06); // 6% of size
  const borderWidthDesktop = Math.round(emojiSizeDesktop * 0.06); // 6% of size for desktop

  // Get user info from session
  const session = await getSession();
  const username = profile.username || `FID ${session?.user?.fid}`;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-8 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Page header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mt-8 md:mt-12 lg:mt-16 pb-4">
        {/* Profile Info Section */}
        <div className="text-center mb-4">
          {/* Profile Picture */}
          <div className="mb-2">
            <ProfilePicture username={username} />
          </div>

          {/* Username and FID */}
          <div className="mb-4">
            <h2 className="text-2xl sm:text-3xl font-light text-white">{profile.username || `User ${session?.user?.fid}`}</h2>
            <p className="text-sm text-neutral-500 font-geist-mono mt-1">FID {session?.user?.fid}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 px-4">
            <div className="text-center">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-light text-white font-geist-mono">{profile.currentStreak}</div>
              <div className="text-[10px] sm:text-xs text-neutral-400 font-geist-mono">CURRENT STREAK</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-light text-white font-geist-mono">{profile.totalVotes}</div>
              <div className="text-[10px] sm:text-xs text-neutral-400 font-geist-mono">TOTAL VOTES</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-light text-white font-geist-mono">{profile.correctGuesses}</div>
              <div className="text-[10px] sm:text-xs text-neutral-400 font-geist-mono">WINNING VOTES</div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting History */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl sm:max-w-5xl pb-12">
        <div className="relative">
          {/* Section Header */}
          <div className="text-center mb-4">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-white">Voting History</h3>
          </div>

          {/* Timeline entries */}
          {profile.votingHistory.length > 0 ? (
            <div className="space-y-12">
              {profile.votingHistory.map((entry, index) => {
                const dateParts = formatDateParts(entry.vote_date);
                const nextEntry = index < profile.votingHistory.length - 1 ? profile.votingHistory[index + 1] : null;

                // Check if this is a missed day
                if ('is_missed_day' in entry) {
                  return (
                    <div key={entry.vote_date}>
                      <div className="group block relative">
                        <div className="relative flex items-center">
                          {/* Left side - Date */}
                          <div className="flex-1 pr-2 sm:pr-4 text-right">
                            <div className="font-geist-mono">
                              <div className="text-neutral-700 text-xs sm:text-sm leading-tight">
                                {dateParts.month}
                              </div>
                              <div className="text-neutral-700 text-xl sm:text-3xl leading-tight -my-1">
                                {dateParts.day}
                              </div>
                              <div className="text-neutral-700 text-xs sm:text-sm leading-tight">
                                {dateParts.year}
                              </div>
                            </div>
                          </div>

                          {/* Center - Empty circle */}
                          <div className="relative z-10 flex-shrink-0">
                            {/* Mobile version */}
                            <div className="bg-[#050505] px-2 relative">
                              <div
                                className="flex items-center justify-center border-[#222222] rounded-full"
                                style={{ width: emojiSize, height: emojiSize, borderWidth: borderWidth }}
                              >
                                {/* Empty circle */}
                              </div>
                            </div>
                          </div>

                          {/* Right side - Missed day text */}
                          <div className="flex-1 pl-2 sm:pl-4">
                            <div className="font-geist-mono flex flex-col items-start justify-center">
                              <div className="text-neutral-700 text-xs sm:text-sm leading-tight">
                                DIDN'T VOTE
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Grey line to next entry */}
                      {index < profile.votingHistory.length - 1 && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 h-12"
                          style={{
                            width: borderWidth,
                            background: nextEntry && !('is_missed_day' in nextEntry)
                              ? `linear-gradient(to bottom, #222222, ${(nextEntry as any).accent_color || '#696969'})`
                              : '#222222'
                          }}
                        />
                      )}
                    </div>
                  );
                }

                // This is a regular vote
                const vote = entry;
                const nextVote = nextEntry && !('is_missed_day' in nextEntry) ? nextEntry : null;
                const currentColor = vote.accent_color || '#696969';
                const nextColor = nextVote?.accent_color || '#696969';

                // Check if this is today's vote
                const isToday = vote.vote_date === today;
                const isTodayWinning = isToday && isCurrentlyWinning(vote.emoji);

                return (
                  <div key={vote.vote_date}>
                    <div className="group block relative">
                      <div className="relative flex items-center">
                        {/* Left side - Date */}
                        <div className="flex-1 pr-2 sm:pr-4 text-right">
                          <div className="font-geist-mono">
                            <div className="text-[#696969] text-xs sm:text-sm leading-tight">
                              {dateParts.month}
                            </div>
                            <div className="text-white text-xl sm:text-3xl leading-tight -my-1">
                              {dateParts.day}
                            </div>
                            <div className="text-[#696969] text-xs sm:text-sm leading-tight">
                              {dateParts.year}
                            </div>
                          </div>
                        </div>

                        {/* Center - Emoji */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="bg-[#050505] px-2 relative">
                            {vote.filename ? (
                              <div className={`relative ${index === 0 ? "animate-pulse" : ""}`}>
                                <Emoji
                                  emoji={vote.emoji}
                                  filename={vote.filename}
                                  containerSize={emojiSize}
                                  borderWidth={borderWidth}
                                  accentColor={vote.accent_color || '#696969'}
                                />
                              </div>
                            ) : (
                              <div
                                className="flex items-center justify-center text-3xl"
                                style={{ width: emojiSize, height: emojiSize }}
                              >
                                {vote.emoji}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side - Time and Status */}
                        <div className="flex-1 pl-2 sm:pl-4">
                          <div className="font-geist-mono">
                            <div className={`text-xs sm:text-sm leading-tight ${vote.is_first_vote ? 'text-white' : 'text-[#696969]'}`} style={vote.is_first_vote ? { color: vote.accent_color || '#696969' } : {}}>
                              {vote.is_first_vote ? 'VOTED FIRST' : 'VOTED'}
                            </div>
                            <div className="text-white text-xl sm:text-3xl leading-tight -my-1">
                              {format(new Date(vote.created_at), 'HH:mm')}<span className="text-[#696969] text-xs sm:text-sm ml-1">UTC</span>
                            </div>
                            <div className={`text-xs sm:text-sm leading-tight ${isToday
                              ? (isTodayWinning ? 'text-white' : 'text-[#696969]')
                              : (vote.is_winner ? 'text-white' : 'text-[#696969]')
                              }`} style={
                                isToday
                                  ? (isTodayWinning ? { color: vote.accent_color || '#696969' } : {})
                                  : (vote.is_winner ? { color: vote.accent_color || '#696969' } : {})
                              }>
                              {isToday
                                ? (isTodayWinning ? 'WINNING' : 'NOT WINNING')
                                : (vote.is_winner ? 'WON' : "DIDN'T WIN")
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gradient line between emojis */}
                    {index < profile.votingHistory.length - 1 && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 h-12 ${index === 0 ? "animate-pulse" : ""}`}
                        style={{
                          width: borderWidth,
                          background: nextEntry && 'is_missed_day' in nextEntry
                            ? `linear-gradient(to bottom, ${currentColor}, #222222)`
                            : `linear-gradient(to bottom, ${currentColor}, ${nextColor})`
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-20">
              <p className="text-neutral-500 text-lg sm:text-2xl">No voting history yet</p>
              <Link
                href="/vote"
                className="mt-4 inline-flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
              >
                <span className="text-sm sm:text-base">Cast your first vote →</span>
              </Link>
            </div>
          )}

          {/* End of timeline indicator */}
          {profile.votingHistory.length > 0 && (
            <>
              {/* Line from last emoji to dot */}
              <div
                className="absolute left-1/2 -translate-x-1/2 h-12"
                style={{
                  width: borderWidth,
                  background: `linear-gradient(to bottom, ${profile.votingHistory[profile.votingHistory.length - 1] &&
                    !('is_missed_day' in profile.votingHistory[profile.votingHistory.length - 1])
                    ? (profile.votingHistory[profile.votingHistory.length - 1] as any).accent_color || '#222222'
                    : '#222222'
                    }, #222222)`
                }}
              />

              {/* End of timeline indicator */}
              <div className="relative mt-8 pt-8">
                <div className="absolute left-1/2 bg-[#222222] rounded-full -translate-x-1/2 top-3" style={{ width: borderWidth, height: borderWidth }} />
                <div className="text-center mt-2">
                  <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl text-neutral-600">Your first vote</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 