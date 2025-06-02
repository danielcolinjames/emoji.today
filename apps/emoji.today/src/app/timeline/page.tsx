import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getDailySummaries } from '@/lib/actions';
import Emoji from '@/components/Emoji';
// import VotedBadge from '@/components/VotedBadge';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface DailySummary {
  id: string;
  vote_date: string;
  winning_emoji: string;
  winning_count: number;
  total_votes: number;
}

interface EmojiData {
  emoji: string;
  accent_color: string;
  filename: string;
}

export const metadata = {
  title: 'emoji.today | Timeline',
  description: 'Every emoji.today',
  openGraph: {
    title: 'emoji.today | Timeline',
    description: 'Every emoji.today',
    images: ['/images/timeline-og.png'],
  },
  twitter: {
    title: 'emoji.today | Timeline',
    description: 'Every emoji.today',
    images: ['/images/timeline-og.png'],
  },
}

async function getTimelineData() {
  try {
    // Fetch daily summaries
    const summaries = await getDailySummaries() as DailySummary[];

    // Fetch emoji data for all winning emojis
    let emojiDataMap = new Map<string, EmojiData>();

    if (summaries.length > 0) {
      const uniqueEmojis = Array.from(new Set(summaries.map((d) => d.winning_emoji)));

      // Handle variation selector normalization
      const emojiVariants = uniqueEmojis
        .flatMap((emoji) => [
          emoji,
          emoji + "\uFE0F", // Add variation selector
          emoji.replace(/\uFE0F/g, ""), // Remove variation selector
        ])
        .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

      const { data: emojiData, error } = await supabase
        .from("emojis")
        .select("emoji, accent_color, filename")
        .in("emoji", emojiVariants);

      if (emojiData) {
        const map = new Map<string, EmojiData>();
        emojiData.forEach((emoji) => {
          if (emoji.accent_color) {
            // Map both the original emoji and its variation selector variants
            const baseEmoji = emoji.emoji.replace(/\uFE0F/g, ""); // Remove variation selector
            const withVariationSelector = baseEmoji + "\uFE0F"; // Add variation selector

            const emojiDataEntry = {
              emoji: emoji.emoji,
              accent_color: emoji.accent_color,
              filename: emoji.filename
            };

            map.set(emoji.emoji, emojiDataEntry); // Original form
            map.set(baseEmoji, emojiDataEntry); // Base form
            map.set(withVariationSelector, emojiDataEntry); // With variation selector
          }
        });
        emojiDataMap = map;
      }
    }

    return { summaries, emojiDataMap };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { summaries: [], emojiDataMap: new Map() };
  }
}

export default async function TimelinePage() {
  const { summaries, emojiDataMap } = await getTimelineData();

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

  const emojiSize = 128; // Mobile size
  const emojiSizeDesktop = 300; // Desktop size matching home page
  const borderWidth = Math.round(emojiSize * 0.06); // 6% of size
  const borderWidthDesktop = Math.round(emojiSizeDesktop * 0.06); // 6% of size for desktop
  const badgeSize = 18;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-4 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Page header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mt-12 md:mt-20 lg:mt-24 pb-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-light text-center">Timeline</h1>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl sm:max-w-5xl pb-12">
        <div className="relative">
          {/* Call to action at top */}
          <div className="relative flex justify-center mb-4 sm:mb-8">
            <Link
              href="/"
              className="animate-pulse relative z-10 bg-[#050505] px-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/images/voted-badge.svg"
                alt="emoji.today"
                width={badgeSize}
                height={badgeSize}
                className="sm:w-6 sm:h-6"
              />
              <div className="flex items-center gap-1 text-neutral-400 group-hover:text-white transition-colors">
                <span className="text-xs sm:text-lg md:text-xl lg:text-2xl">Vote on today</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
              </div>
            </Link>
          </div>

          {/* Timeline entries */}
          <div className="space-y-16 sm:space-y-24">
            {summaries.map((summary, index) => {
              const emojiData = emojiDataMap.get(summary.winning_emoji);
              const dateParts = formatDateParts(summary.vote_date);
              const nextEmojiData = index < summaries.length - 1 ? emojiDataMap.get(summaries[index + 1].winning_emoji) : null;

              const currentColor = emojiData?.accent_color || '#696969';
              const nextColor = nextEmojiData?.accent_color || '#696969';

              return (
                <div key={summary.id}>
                  {/* <Link */}
                  {/* // href={`/results/${summary.vote_date}`} */}
                  <div className="group block relative"
                  >
                    <div className="relative flex items-center">
                      {/* Left side - Date */}
                      <div className="flex-1 pr-2 sm:pr-4 text-right">
                        <div className="font-geist-mono">
                          <div className="text-[#696969] text-xs sm:text-sm leading-tight">
                            {dateParts.month}
                          </div>
                          <div className="text-white text-2xl sm:text-5xl leading-tight -my-1 sm:-my-2">
                            {dateParts.day}
                          </div>
                          <div className="text-[#696969] text-xs sm:text-sm leading-tight">
                            {dateParts.year}
                          </div>
                        </div>
                      </div>

                      {/* Center - Emoji (Mobile and Desktop versions) */}
                      <div className="relative z-10 flex-shrink-0">
                        {/* Mobile version */}
                        <div className="sm:hidden bg-[#050505] px-2 relative">
                          {emojiData ? (
                            <div className={`relative ${index === 0 ? "animate-pulse" : ""}`}>
                              <Emoji
                                emoji={summary.winning_emoji}
                                filename={emojiData.filename}
                                containerSize={emojiSize}
                                borderWidth={borderWidth}
                                accentColor={emojiData.accent_color}
                              />
                              {/* Badge for mobile */}
                              {/* {index !== 0 && (
                                <div
                                  className="absolute -bottom-1 -right-1"
                                >
                                  <VotedBadge
                                    color={emojiData.accent_color}
                                    size={18}
                                  />
                                </div>
                              )} */}
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-center text-5xl"
                              style={{ width: emojiSize, height: emojiSize }}
                            >
                              {summary.winning_emoji}
                            </div>
                          )}
                        </div>
                        {/* Desktop version */}
                        <div className="hidden sm:block bg-[#050505] px-4 relative">
                          {emojiData ? (
                            <div className={`relative ${index === 0 ? "animate-pulse" : ""}`}>
                              <Emoji
                                emoji={summary.winning_emoji}
                                filename={emojiData.filename}
                                containerSize={emojiSizeDesktop}
                                borderWidth={borderWidthDesktop}
                                accentColor={emojiData.accent_color}
                              />
                              {/* Badge for desktop */}
                              {/* {index !== 0 && (
                                <div
                                  className="absolute bottom-4 right-4"
                                >
                                  <VotedBadge
                                    color={emojiData.accent_color}
                                    size={72}
                                  />
                                </div>
                              )} */}
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-center text-8xl"
                              style={{ width: emojiSizeDesktop, height: emojiSizeDesktop }}
                            >
                              {summary.winning_emoji}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Vote count */}
                      <div className="flex-1 pl-2 sm:pl-4">
                        <div className="font-geist-mono">
                          <div className="text-[#696969] text-xs sm:text-sm leading-tight">
                            WITH
                          </div>
                          <div className="text-white text-2xl sm:text-5xl leading-tight -my-1 sm:-my-2">
                            {summary.winning_count.toLocaleString()}<span className="text-[#696969] text-xs sm:text-xl">/{summary.total_votes.toLocaleString()}</span>

                          </div>
                          <div className="text-[#696969] text-xs sm:text-sm leading-tight">
                            VOTES
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gradient line between emojis - responsive */}
                  {index < summaries.length - 1 && (
                    <>
                      {/* Mobile line */}
                      <div
                        className={`sm:hidden absolute left-1/2 -translate-x-1/2 h-16 ${index === 0 ? "animate-pulse" : ""}`}
                        style={{
                          width: borderWidth,
                          background: `linear-gradient(to bottom, ${currentColor}, ${nextColor})`
                        }}
                      />
                      {/* Desktop line */}
                      <div
                        className={`hidden sm:block absolute left-1/2 -translate-x-1/2 h-24 ${index === 0 ? "animate-pulse" : ""}`}
                        style={{
                          width: borderWidthDesktop,
                          background: `linear-gradient(to bottom, ${currentColor}, ${nextColor})`
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fade to gray line and end indicator - responsive */}
          {summaries.length > 0 && (
            <>
              {/* Line from last emoji to dot - Mobile */}
              <div
                className="sm:hidden absolute left-1/2 -translate-x-1/2 h-16"
                style={{
                  width: borderWidth,
                  background: `linear-gradient(to bottom, ${emojiDataMap.get(summaries[summaries.length - 1].winning_emoji)?.accent_color || '#696969'}, #696969)`
                }}
              />
              {/* Line from last emoji to dot - Desktop */}
              <div
                className="hidden sm:block absolute left-1/2 -translate-x-1/2 h-24"
                style={{
                  width: borderWidthDesktop,
                  background: `linear-gradient(to bottom, ${emojiDataMap.get(summaries[summaries.length - 1].winning_emoji)?.accent_color || '#696969'}, #696969)`
                }}
              />

              {/* End of timeline indicator */}
              <div className="relative mt-8 sm:mt-12 pt-8">
                {/* Mobile dot */}
                <div className="sm:hidden absolute left-1/2 bg-neutral-500 rounded-full -translate-x-1/2 top-7 sm:top-10 md:top-12 lg:top-4" style={{ width: borderWidth, height: borderWidth }} />
                {/* Desktop dot */}
                <div className="hidden sm:block absolute left-1/2 bg-neutral-500 rounded-full -translate-x-1/2 top-7 sm:top-10" style={{ width: borderWidthDesktop, height: borderWidthDesktop }} />
                <div className="text-center mt-6 sm:mt-10">
                  <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl text-neutral-600">The beginning</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Empty state */}
        {summaries.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg sm:text-2xl">No voting history yet</p>
          </div>
        )}
      </main>
    </div>
  );
} 