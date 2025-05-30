"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { supabase } from "@/lib/supabase"

interface MintSignatureResult {
  success: boolean
  signature?: any
  error?: string
}

// Validate wallet address
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export async function generateMintSignature(
  walletAddress: string,
  selectedEmoji: string,
  voteDate: string
): Promise<MintSignatureResult> {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.fid) {
      return { success: false, error: "Unauthorized" }
    }

    // Call the API route instead of duplicating logic
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/mint-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass the session cookie for authentication
        Cookie:
          process.env.NODE_ENV === "development"
            ? "next-auth.session-token=dev"
            : "",
      },
      body: JSON.stringify({
        walletAddress,
        selectedEmoji,
        voteDate,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`,
      }
    }

    return result
  } catch (error) {
    console.error("Error in generateMintSignature server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Development-only function to clean up failed mint records
export async function cleanupFailedMint(
  selectedEmoji: string,
  voteDate: string
): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Cleanup only available in development" }
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.fid) {
      return { success: false, error: "Unauthorized" }
    }

    // Find the vote
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("*")
      .eq("fid", session.user.fid)
      .eq("emoji", selectedEmoji)
      .eq("vote_date", voteDate)
      .single()

    if (voteError || !vote) {
      return { success: false, error: "Vote not found" }
    }

    // Delete any existing mint records for this vote
    const { error: deleteError } = await supabase
      .from("vote_nfts")
      .delete()
      .eq("vote_id", vote.id)

    if (deleteError) {
      console.error("Failed to delete mint record:", deleteError)
      return { success: false, error: "Failed to delete mint record" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error cleaning up mint record:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
