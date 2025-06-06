import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getCurrentVotingDateString } from '@/lib/date-utils';

const VotePageClient = dynamic(() => import('./VotePageClient'));

interface VotePageProps {
  searchParams: Promise<{
    emoji?: string;
    date?: string;
    accentColor?: string;
    winner?: string;
    totalVotes?: string;
  }>;
}

// Metadata generation for share cards
export async function generateMetadata({ searchParams }: VotePageProps): Promise<Metadata> {
  const params = await searchParams;
  const emoji = params.emoji || '🗳️';
  const date = params.date || getCurrentVotingDateString();
  const accentColor = params.accentColor || '#FFFFFF';
  const isWinner = params.winner === 'true';
  const totalVotes = params.totalVotes ? parseInt(params.totalVotes) : undefined;

  // Format date as "JUN 3, 2025" for titles
  const dateObj = new Date(date);
  const shortFormattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  // Format for full date display in descriptions
  const fullFormattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Different titles and descriptions for winners vs individual votes
  let title: string;
  let description: string;

  title = `I voted ${emoji} for ${shortFormattedDate} on emoji.today`;
  description = `Join me in voting for the emoji that best represents ${fullFormattedDate} on emoji.today`;

  const ogImageUrl = `/api/og?emoji=${encodeURIComponent(emoji)}&date=${date}&accentColor=${encodeURIComponent(accentColor)}`;

  const fullOgImageUrl = `${window.location.origin}${ogImageUrl}`;
  const imageSize = isWinner ? { width: 1200, height: 630 } : { width: 1000, height: 1000 };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: fullOgImageUrl,
          width: imageSize.width,
          height: imageSize.height,
          alt: `${emoji} - ${fullFormattedDate} on emoji.today`,
        },
      ],
      type: 'website',
      url: `https://emoji.today/vote?emoji=${encodeURIComponent(emoji)}&date=${date}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImageUrl],
    },
  };
}

export default function VotePage() {
  return <VotePageClient />;
} 