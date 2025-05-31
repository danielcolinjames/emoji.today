"use client";

interface MintVoteButtonProps {
  emoji: string;
  date?: string;
  className?: string;
  disabled?: boolean;
}

export function MintVoteButton({
  emoji,
  date = new Date().toISOString().split('T')[0],
  className = "",
  disabled = false
}: MintVoteButtonProps) {
  // Temporary: ThirdwebProvider is disabled due to WalletConnect conflicts
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
        <h3 className="text-yellow-400 font-medium mb-2">NFT Minting Temporarily Unavailable</h3>
        <p className="text-sm text-yellow-300 mb-3">
          NFT minting is temporarily disabled due to WalletConnect dependency conflicts.
          We're working on fixing this issue.
        </p>
        <p className="text-xs text-yellow-400">
          Your vote for {emoji} on {date} is still recorded! You'll be able to mint it as an NFT once this is resolved.
        </p>
      </div>
    </div>
  );
} 