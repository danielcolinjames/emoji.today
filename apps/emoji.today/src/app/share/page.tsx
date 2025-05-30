import { getSession } from '@/auth';
import { Metadata } from 'next';
import NewHomePage from '@/components/NewHomePage';

interface SharePageProps {
  searchParams: Promise<{
    emoji?: string;
    date?: string;
    accentColor?: string;
    winner?: string;
    totalVotes?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const emoji = params.emoji || '🗳️';
  const date = params.date || new Date().toISOString().split('T')[0];
  const accentColor = params.accentColor || '#FFFFFF';
  const isWinner = params.winner === 'true';
  const totalVotes = params.totalVotes ? parseInt(params.totalVotes) : undefined;

  // Format date for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Different titles and descriptions for winners vs individual votes
  let title: string;
  let description: string;

  if (isWinner && totalVotes) {
    title = `${emoji} has won ${formattedDate} on emoji.today!`;
    description = `${emoji} is the emoji of the day! ${totalVotes} people voted. What emoji will win tomorrow? Vote at emoji.today`;
  } else {
    title = `I voted ${emoji} for ${formattedDate} on emoji.today`;
    description = `Join me in voting for today's emoji on emoji.today! What emoji best represents ${formattedDate}?`;
  }

  // Use the regular OG image for winners (cleaner look for automated posts)
  // Use participation image for individual user shares
  const ogImageUrl = isWinner
    ? `/api/og?emoji=${encodeURIComponent(emoji)}&date=${date}&accentColor=${encodeURIComponent(accentColor)}`
    : `/api/og?emoji=${encodeURIComponent(emoji)}&date=${date}&accentColor=${encodeURIComponent(accentColor)}`;

  const fullOgImageUrl = `https://emoji.today${ogImageUrl}`;
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
          alt: `${emoji} - ${formattedDate} ${isWinner ? 'winner' : 'vote'} on emoji.today`,
        },
      ],
      type: 'website',
      url: `https://emoji.today/share?emoji=${encodeURIComponent(emoji)}&date=${date}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  // Instead of redirecting, render the home page content
  // This allows crawlers to read the meta tags while users see the familiar interface
  return <NewHomePage />;
} 