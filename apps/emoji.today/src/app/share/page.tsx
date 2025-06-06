import { redirect } from 'next/navigation';

interface SharePageProps {
  searchParams: Promise<{
    emoji?: string;
    date?: string;
    accentColor?: string;
    winner?: string;
    totalVotes?: string;
  }>;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;

  // Build query string for redirect
  const queryParams = new URLSearchParams();
  if (params.emoji) queryParams.set('emoji', params.emoji);
  if (params.date) queryParams.set('date', params.date);
  if (params.accentColor) queryParams.set('accentColor', params.accentColor);
  if (params.winner) queryParams.set('winner', params.winner);
  if (params.totalVotes) queryParams.set('totalVotes', params.totalVotes);

  const queryString = queryParams.toString();
  const redirectUrl = `/vote${queryString ? `?${queryString}` : ''}`;

  redirect(redirectUrl);
} 