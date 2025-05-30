"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useSession } from "next-auth/react";
import { generateMintSignature } from "@/actions/mint";

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
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { writeContract, data: writeData, isPending: isWritePending } = useWriteContract();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Monitor transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  // Handle transaction hash when writeData becomes available
  useEffect(() => {
    if (writeData && !txHash) {
      setTxHash(writeData);
      setSuccess(true);
      setIsLoading(false);
    }
  }, [writeData, txHash]);

  const handleConnectWallet = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Connect with the first available connector (usually injected wallet)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async () => {
    if (!address || !session?.user?.fid) {
      setError("Wallet not connected or user not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Get mint signature from server action
      const result = await generateMintSignature(address, emoji, date);

      if (!result.success) {
        throw new Error(result.error || "Failed to generate mint signature");
      }

      // Step 2: Execute the mint transaction using wagmi
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

      writeContract({
        address: contractAddress,
        abi: [
          {
            name: "mintWithSignature",
            type: "function",
            stateMutability: "payable",
            inputs: [
              {
                name: "req", type: "tuple", components: [
                  { name: "to", type: "address" },
                  { name: "royaltyRecipient", type: "address" },
                  { name: "royaltyBps", type: "uint256" },
                  { name: "primarySaleRecipient", type: "address" },
                  { name: "uri", type: "string" },
                  { name: "price", type: "uint256" },
                  { name: "currency", type: "address" },
                  { name: "validityStartTimestamp", type: "uint128" },
                  { name: "validityEndTimestamp", type: "uint128" },
                  { name: "uid", type: "bytes32" }
                ]
              },
              { name: "signature", type: "bytes" }
            ],
            outputs: []
          }
        ],
        functionName: "mintWithSignature",
        args: [result.signature.payload, result.signature.signature],
        value: parseEther("0.001"), // 0.001 ETH
      });

      // Transaction will be handled by useEffect when writeData becomes available

    } catch (err) {
      console.error("Minting error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to mint NFT. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success && txHash && isConfirmed) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <h3 className="text-green-400 font-medium mb-2">NFT Minted Successfully! 🎉</h3>
          <p className="text-sm text-green-300 mb-3">
            Your vote badge NFT has been minted to your wallet.
          </p>
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-400 hover:text-green-300 underline"
          >
            View transaction on BaseScan
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <h3 className="text-red-400 font-medium mb-2">Minting Failed</h3>
          <p className="text-sm text-red-300 mb-3">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setSuccess(false);
              setTxHash(null);
            }}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Main button states
  if (!isConnected || !address) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
          <h3 className="text-purple-400 font-medium mb-2">Mint Vote Badge NFT</h3>
          <p className="text-sm text-purple-300 mb-3">
            Commemorate your vote for {emoji} on {date} as an NFT badge (0.001 ETH)
          </p>

          <button
            onClick={handleConnectWallet}
            disabled={disabled || isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                💎 Connect Wallet to Mint
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
        <h3 className="text-purple-400 font-medium mb-2">Mint Vote Badge NFT</h3>
        <p className="text-sm text-purple-300 mb-3">
          Commemorate your vote for {emoji} on {date} as an NFT badge (0.001 ETH)
        </p>

        <div className="text-xs text-neutral-400 text-center mb-3">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </div>

        <button
          onClick={handleMint}
          disabled={disabled || isLoading || isWritePending || isConfirming}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading || isWritePending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isLoading ? "Preparing..." : "Minting..."}
            </>
          ) : isConfirming ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              💎 Mint your vote for 0.001 ETH
            </>
          )}
        </button>

        <p className="text-xs text-neutral-500 text-center mt-2">
          Mint an NFT of your vote for {emoji} on {date}
        </p>
      </div>
    </div>
  );
} 