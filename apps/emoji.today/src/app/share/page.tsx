import { redirect } from 'next/navigation';
import { getSession } from '@/auth';
import { Metadata } from 'next';

interface SharePageProps {
  searchParams: Promise<{
    emoji?: string;
    date?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const emoji = params.emoji || '🗳️';
  const date = params.date || new Date().toISOString().split('T')[0];

  // Format date for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const title = `I voted ${emoji} for ${formattedDate} on emoji.today`;
  const description = `Join me in voting for today's emoji on emoji.today! What emoji best represents ${formattedDate}?`;

  // Construct the OG image URL with parameters
  const ogImageUrl = `/api/og?emoji=${encodeURIComponent(emoji)}&date=${date}`;
  const fullOgImageUrl = `https://emoji.today${ogImageUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: fullOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${emoji} - ${formattedDate} vote on emoji.today`,
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
  const session = await getSession();

  // Redirect to home if not logged in
  if (!session?.user) {
    redirect('/');
  }

  // If user is logged in, redirect to the main app
  // You could also render a special share page here if desired
  redirect('/');
} 