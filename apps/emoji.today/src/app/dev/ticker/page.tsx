import { LiveTicker } from '@/components/LiveTicker';

export default function TickerTestPage() {
  if (process.env.NODE_ENV === 'production') {
    return <div>Not available in production</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🧪 Ticker Test Page</h1>
      <p className="text-neutral-400 mb-8">Dev-only page to test the LiveTicker component</p>

      {/* Mock VotingResults layout */}
      <div className="space-y-4 pb-20">
        <div className="bg-neutral-800 p-4 rounded">Mock voting results content...</div>
        <div className="bg-neutral-800 p-4 rounded">More content...</div>
        <div className="bg-neutral-800 p-4 rounded">Even more content to simulate scroll...</div>

        {/* Fixed ticker at bottom like in VotingResults */}
        <div className="fixed bottom-16 left-0 right-0 z-40">
          <LiveTicker />
        </div>

        {/* Mock status bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-neutral-800 px-4 pt-2 pb-6 z-50">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="text-neutral-500 text-xs uppercase tracking-wider font-mono">
              DEV TICKER TEST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 