import { Suspense } from 'react';
import { getSession } from "@/auth";
import { redirect } from 'next/navigation';
import { LeaderboardClient } from '@/app/leaderboard/LeaderboardClient';

export default async function LeaderboardPage() {
  const session = await getSession();

  if (!session?.user?.fid) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-8 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Page header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mt-8 md:mt-12 lg:mt-16 pb-2">
        <div className="text-center mb-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white">
            Leaderboard
          </h1>
        </div>
      </div>

      {/* Leaderboard Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl sm:max-w-5xl pb-12">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <LeaderboardClient />
        </Suspense>
      </main>
    </div>
  );
} 