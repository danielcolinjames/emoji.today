import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { supabase } from '@/lib/supabase';
import Emoji from '@/components/Emoji';

interface PageProps {
  params: {
    date: string;
  };
}

interface EmojiResult {
  emoji: string;
  count: number;
  percentage: number;
}

interface DailySummary {
  id: string;
  vote_date: string;
  winning_emoji: string;
  winning_count: number;
  total_votes: number;
  unique_emojis: number;
  top_5_emojis: EmojiResult[] | null;
}

interface EmojiData {
  emoji: string;
  accent_color: string;
  filename: string;
}

export default async function ResultsPage({ params }: PageProps) {
  const { date } = params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  // Fetch daily summary for this date
  const { data: summary, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('vote_date', date)
    .single();

  if (error || !summary) {
    notFound();
  }

  // Cast the summary to the proper type
  const typedSummary = summary as DailySummary;
  const topEmojis = typedSummary.top_5_emojis as EmojiResult[] | null;

  // Fetch emoji data for all emojis in top 5
  const emojisToFetch = topEmojis?.map(e => e.emoji) || [];
  emojisToFetch.push(typedSummary.winning_emoji); // Ensure winner is included

  const uniqueEmojis = Array.from(new Set(emojisToFetch));

  // Handle variation selector normalization
  const emojiVariants = uniqueEmojis
    .flatMap((emoji) => [
      emoji,
      emoji + "\uFE0F", // Add variation selector
      emoji.replace(/\uFE0F/g, ""), // Remove variation selector
    ])
    .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

  const { data: emojiData } = await supabase
    .from("emojis")
    .select("emoji, accent_color, filename")
    .in("emoji", emojiVariants);

  // Create emoji data map
  const emojiDataMap = new Map<string, EmojiData>();
  emojiData?.forEach((emoji) => {
    if (emoji.accent_color) {
      const baseEmoji = emoji.emoji.replace(/\uFE0F/g, "");
      const withVariationSelector = baseEmoji + "\uFE0F";

      const emojiDataEntry = {
        emoji: emoji.emoji,
        accent_color: emoji.accent_color,
        filename: emoji.filename
      };

      emojiDataMap.set(emoji.emoji, emojiDataEntry);
      emojiDataMap.set(baseEmoji, emojiDataEntry);
      emojiDataMap.set(withVariationSelector, emojiDataEntry);
    }
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00.000Z');
    const utcDate = toZonedTime(date, 'UTC');
    return format(utcDate, 'MMMM d, yyyy');
  };

  const winnerEmojiData = emojiDataMap.get(typedSummary.winning_emoji);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-neutral-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/timeline"
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Timeline</span>
            </Link>
            <h1 className="text-lg font-light font-geist-mono">{formatDate(typedSummary.vote_date)}</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
        {/* Winner section */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-light mb-8">Today's Emoji</h2>
          <div className="flex justify-center mb-6">
            {winnerEmojiData ? (
              <Emoji
                emoji={typedSummary.winning_emoji}
                filename={winnerEmojiData.filename}
                containerSize={200}
                borderWidth={8}
                accentColor={winnerEmojiData.accent_color}
              />
            ) : (
              <div className="text-8xl">{typedSummary.winning_emoji}</div>
            )}
          </div>
          <p className="text-xl text-neutral-400">
            <span className="text-white font-medium">{typedSummary.winning_count}</span> votes
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            {Math.round((typedSummary.winning_count / typedSummary.total_votes) * 100)}% of {typedSummary.total_votes} total votes
          </p>
        </div>

        {/* Top 5 section */}
        {topEmojis && topEmojis.length > 0 && (
          <div>
            <h3 className="text-xl font-light mb-8">Top 5 Emojis</h3>
            <div className="space-y-6">
              {topEmojis.map((result: EmojiResult, index: number) => {
                const emojiInfo = emojiDataMap.get(result.emoji);
                const isWinner = result.emoji === typedSummary.winning_emoji;

                return (
                  <div key={`${result.emoji}-${index}`} className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="w-8 text-center">
                      <span className={`text-lg font-geist-mono ${isWinner ? 'text-white' : 'text-neutral-500'}`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Emoji */}
                    <div className="flex-shrink-0">
                      {emojiInfo ? (
                        <div className="w-12 h-12">
                          <Emoji
                            emoji={result.emoji}
                            filename={emojiInfo.filename}
                            containerSize={48}
                            borderWidth={0}
                            accentColor={emojiInfo.accent_color}
                          />
                        </div>
                      ) : (
                        <div className="text-3xl w-12 h-12 flex items-center justify-center">
                          {result.emoji}
                        </div>
                      )}
                    </div>

                    {/* Progress bar and stats */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm ${isWinner ? 'text-white font-medium' : 'text-neutral-400'}`}>
                          {result.count} votes
                        </span>
                        <span className={`text-sm ${isWinner ? 'text-white' : 'text-neutral-500'}`}>
                          {result.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWinner ? 'bg-white' : 'bg-neutral-600'
                            }`}
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-2xl font-light text-white">{typedSummary.total_votes}</p>
              <p className="text-sm text-neutral-500 mt-1">Total Votes</p>
            </div>
            <div>
              <p className="text-2xl font-light text-white">{typedSummary.unique_emojis}</p>
              <p className="text-sm text-neutral-500 mt-1">Unique Emojis</p>
            </div>
            <div>
              <p className="text-2xl font-light text-white">
                {typedSummary.total_votes > 0 ? Math.round(typedSummary.total_votes / typedSummary.unique_emojis) : 0}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Avg per Emoji</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 