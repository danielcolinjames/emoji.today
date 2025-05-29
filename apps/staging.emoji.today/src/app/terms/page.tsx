import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back to Home Button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">Terms & Conditions</h1>

      <div className="prose prose-lg max-w-none">
        <h2>Welcome to emoji.today</h2>
        <p>
          By using emoji.today, you agree to these terms and conditions. Please read them carefully.
        </p>

        <h2>About Our Service</h2>
        <p>
          emoji.today is a daily voting platform where users can vote for an emoji that best represents each day.
          The service is currently in beta and features may change.
        </p>

        <h2>Your Account</h2>
        <p>
          You can sign in using your Farcaster account. We store minimal information including your Farcaster ID (FID)
          and voting history to provide the service.
        </p>

        <h2>Voting Rules</h2>
        <ul>
          <li>You can vote once per day</li>
          <li>Votes cannot be changed once submitted</li>
          <li>Results are visible only after you vote</li>
          <li>We reserve the right to remove votes that violate our community guidelines</li>
        </ul>

        <h2>Privacy</h2>
        <p>
          We respect your privacy and only collect data necessary to provide the service.
          Your voting data is associated with your Farcaster ID but is not shared publicly in a way that identifies you personally.
        </p>

        <h2>Acceptable Use</h2>
        <p>
          You agree to use the service in good faith and not attempt to manipulate voting results,
          create multiple accounts, or use automated tools to vote.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about these terms, please contact us through our social media channels.
        </p>

        <div className="mt-8 text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
} 