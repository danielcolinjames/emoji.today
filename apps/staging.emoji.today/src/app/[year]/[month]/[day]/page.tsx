import { AuthWrapper } from "~/components/AuthWrapper";
import { Button } from "~/components/ui/Button";
import Link from "next/link";

interface PageProps {
  params: {
    year: string;
    month: string;
    day: string;
  };
}

export default function DayDetailPage({ params }: PageProps) {
  const { year, month, day } = params;
  const date = new Date(`${year}-${month}-${day}`);
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2 text-center tracking-branded">
        {date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </h1>

      {isToday ? (
        <div className="text-center mb-8">
          <p className="text-brand-primary font-semibold">Today's vote is live!</p>
        </div>
      ) : (
        <div className="text-center mb-8 text-gray-600">
          <p>Historical results</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Results section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Results</h2>

          <AuthWrapper
            requireAuth={isToday}
            fallback={
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Vote to see today's live results!
                </p>
                <Link href="/vote">
                  <Button className="bg-brand-primary hover:bg-brand-500">
                    Vote Now
                  </Button>
                </Link>
              </div>
            }
          >
            <div className="space-y-4">
              {/* TODO: Fetch and display actual results */}
              <div className="text-center text-gray-400 py-8">
                Results will be displayed here...
              </div>
            </div>
          </AuthWrapper>
        </div>

        {/* Winner section (only for past days) */}
        {!isToday && (
          <div className="bg-brand-50 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Winner</h2>
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-lg font-semibold">Winning emoji will appear here</p>
            </div>
          </div>
        )}

        {/* Vote CTA for today */}
        {isToday && (
          <div className="bg-gradient-to-br from-brand-100 to-brand-200 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Cast Your Vote</h2>
            <p className="text-gray-700 mb-6">
              Be part of history. Choose the emoji that best represents today.
            </p>
            <Link href="/vote">
              <Button className="bg-white text-brand-600 hover:bg-brand-50">
                Vote Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 