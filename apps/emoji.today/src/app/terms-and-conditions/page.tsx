import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Terms and Conditions - emoji.today",
  description: "Terms and Conditions for emoji.today",
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to home link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 group"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-200 group-hover:-translate-x-1"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Home
          </Link>
        </div>

        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            Terms and Conditions
          </h1>
          <p className="text-lg text-neutral-500 mt-2">
            Last Updated: May 30, 2025
          </p>
        </header>

        <div className="prose prose-lg prose-invert max-w-none space-y-8">
          <div className="text-lg leading-relaxed space-y-6">
            <p>
              These Terms and Conditions (the <strong>"Terms"</strong>) govern your access to and use of <strong>emoji.today</strong>,
              a global emoji-voting experience operated by The Company (<strong>"The Company,"</strong> <strong>"we,"</strong> <strong>"us,"</strong> or <strong>"our"</strong>).
              By accessing or participating in emoji.today, you agree to be bound by these Terms. If you do not agree, do not use emoji.today.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
            <div className="space-y-4">
              <p>Signing in to emoji.today constitutes your full acceptance of these Terms and any additional rules or guidelines we post (collectively, the <strong>"Rules"</strong>).</p>
              <p>Participation is voluntary; you may stop at any time.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Eligibility (Age & Account)</h2>
            <div className="space-y-4">
              <p><strong>Age Restriction:</strong> emoji.today is available only to individuals 18 years of age or older.</p>
              <p><strong>Farcaster Account:</strong> A valid Farcaster account is required for authentication. You are responsible for keeping your Farcaster credentials secure. All activity from your Farcaster account on emoji.today is deemed to be yours.</p>
              <p><strong>One Account Per Person:</strong> Creating or controlling multiple Farcaster IDs to evade the one-vote-per-day rule is prohibited; we may disqualify votes or terminate participation for suspected abuse.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. How emoji.today Works</h2>
            <div className="space-y-4">
              <p><strong>Voting Window:</strong> 00:00 UTC – 23:59 UTC each day.</p>
              <p><strong>One Irrevocable Vote:</strong> You may cast one (1) vote per day, and it cannot be changed once submitted.</p>
              <p><strong>No Moderation of Emoji Choices:</strong> All standard Unicode emojis are valid options; the result is purely democratic.</p>
              <p><strong>Daily Winner & NFT Minting:</strong> After the window closes, the emoji with the most votes is minted as a unique Daily Emoji NFT on the Base blockchain and permanently added to a public timeline.</p>
              <p><strong>Rule Evolution:</strong> The Company may refine mechanics (e.g., tie-breakers) or add new features, providing notice under Section 11.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Optional USD $1 Participation NFT</h2>
            <div className="space-y-4">
              <p>After voting, you may optionally purchase a Participation NFT for USD $1 (plus any blockchain gas or processor fees).</p>
              <p>Purchases are final and non-refundable.</p>
              <p>Delivery requires a Base-compatible wallet; you are responsible for correct wallet details and wallet security.</p>
              <p>Limit: one Participation NFT per voter per day.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Daily Emoji NFT Auction & Future Rewards</h2>
            <div className="space-y-4">
              <p>Each Daily Emoji NFT is auctioned the following day; auction details will be announced.</p>
              <p>Proceeds belong to The Company.</p>
              <p><strong>Future Reward Mechanism:</strong> The Company intends (but does not guarantee) to share future auction, sponsorship, or advertisement proceeds with users who voted for the winning emoji. Any such mechanism will be announced separately and governed by these or additional terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Public Nature of Votes</h2>
            <div className="space-y-4">
              <p>Your vote (emoji + Farcaster ID) is publicly visible and may be immutably recorded on-chain.</p>
              <p>Real-time leaderboards and results may be displayed and promoted publicly.</p>
              <p>The Company does not censor or filter emoji options; community choice prevails.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Privacy & Data Protection</h2>
            <div className="space-y-4">
              <p><strong>Data We Collect:</strong> Farcaster ID, your vote, wallet address for NFT delivery, and minimal usage analytics.</p>
              <p><strong>No Unnecessary Data:</strong> We collect nothing beyond what is required to operate emoji.today.</p>
              <p><strong>Compliance:</strong> We adhere to GDPR, CCPA, and other applicable privacy laws.</p>
              <p><strong>Public Record:</strong> Votes and on-chain data are inherently public and cannot be erased. Non-public personal data (e.g., payment details) is handled by trusted third-party processors and kept confidential.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Blockchain Risks & Your Responsibilities</h2>
            <div className="space-y-4">
              <p>Blockchain transactions are irreversible.</p>
              <p>NFT and cryptocurrency values are speculative and may be zero.</p>
              <p>You are solely responsible for wallet security, private keys, and compliance with local regulations.</p>
              <p>The Company is not liable for lost keys, failed transactions, or blockchain/network outages.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Disclaimers & Limitation of Liability</h2>
            <div className="space-y-4">
              <p><strong>emoji.today is provided "as is" and "as available."</strong></p>
              <p><strong>No Warranties:</strong> The Company disclaims all warranties, express or implied.</p>
              <p><strong>No Guarantee of Value:</strong> We do not guarantee any particular value or utility of NFTs.</p>
              <p><strong>Maximum Liability:</strong> The Company's aggregate liability is capped at the greater of (a) the amounts you paid us in the past 12 months or (b) CAD $100, except where prohibited by law.</p>
              <p><em>Some jurisdictions do not allow certain limitations; where prohibited, those limitations will not apply to the extent required by law.</em></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. User Consents</h2>
            <div className="space-y-4">
              <p>By participating in emoji.today you expressly consent to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Public Display of Your Votes.</strong></li>
                <li><strong>Immediate, Non-Refundable Delivery of Digital Goods.</strong></li>
                <li><strong>The Company's right to showcase daily results (including your public Farcaster ID) for promotional purposes.</strong></li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Changes to These Terms</h2>
            <div className="space-y-4">
              <p><strong>Notice:</strong> Material changes will be announced via emoji.today, email, or Farcaster and will take effect on the stated date.</p>
              <p><strong>Acceptance:</strong> Continued use after the effective date signifies acceptance.</p>
              <p><strong>Minor Updates:</strong> Non-material edits may take effect immediately upon posting.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">12. Governing Law & Dispute Resolution</h2>
            <div className="space-y-4">
              <p>These Terms are governed by the laws of British Columbia, Canada and applicable federal laws.</p>
              <p><strong>Exclusive jurisdiction:</strong> courts of British Columbia, unless non-waivable consumer protection law requires otherwise.</p>
              <p>Any claim must be brought within one (1) year of accrual unless a longer period is required by law.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">13. Miscellaneous</h2>
            <div className="space-y-4">
              <p><strong>Severability:</strong> If any provision is unenforceable, the remainder stays in force.</p>
              <p><strong>No Waiver:</strong> Our failure to enforce any term is not a waiver.</p>
              <p><strong>Entire Agreement:</strong> These Terms (plus any Rules + Privacy Policy) are the entire agreement between you and The Company regarding emoji.today.</p>
              <p><strong>Assignment:</strong> You may not transfer your rights; we may assign ours in connection with corporate changes.</p>
              <p><strong>Headings:</strong> Headings are for convenience only.</p>
              <p><strong>Survival:</strong> Sections that by their nature should survive termination do so.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">14. Contact Us</h2>
            <div className="space-y-4">
              <p>
                <strong>Email:</strong> <a href="mailto:hello@emoji.today" className="text-orange-500 hover:underline">hello@emoji.today</a>
              </p>
              <p>
                <strong>Farcaster:</strong> <a href="https://farcaster.xyz/emojitoday" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">@emojitoday</a>
              </p>
              <p>
                <strong>X (Twitter):</strong> <a href="https://x.com/emoji_today" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">@emoji_today</a>
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-neutral-700 text-center">
            <p className="text-lg text-neutral-300">
              By signing in to emoji.today, you confirm you have read, understood, and accept these Terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 