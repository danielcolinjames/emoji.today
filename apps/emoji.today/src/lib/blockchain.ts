import { createThirdwebClient, getContract } from "thirdweb"
import { base, baseSepolia } from "thirdweb/chains"

// Create Thirdweb client
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
})

// Define chains
export const baseMainnet = base
export const baseTestnet = baseSepolia

// Get the appropriate chain based on environment
export const getChain = () => {
  return process.env.NODE_ENV === "production" ? baseMainnet : baseTestnet
}

// Contract configuration
export const NFT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!

// Get the NFT contract instance
export const getNFTContract = () => {
  return getContract({
    client: thirdwebClient,
    chain: getChain(),
    address: NFT_CONTRACT_ADDRESS,
  })
}

export const MINT_PRICE = 0.001 // 0.001 ETH

// Helper to format ETH amounts (18 decimals)
export function formatETHAmount(amount: number): string {
  return (amount * 1e18).toString()
}

// Validate wallet address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Get user's wallet address from Farcaster data
export function getUserWalletAddress(user: any): string | null {
  // In Farcaster, users can have connected wallets
  if (user?.verifications && user.verifications.length > 0) {
    return user.verifications[0]
  }

  // Fallback: if user has a custody address
  if (user?.custody_address) {
    return user.custody_address
  }

  return null
}
