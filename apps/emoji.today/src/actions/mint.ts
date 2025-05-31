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

    // Validate required fields
    if (!walletAddress || !selectedEmoji || !voteDate) {
      return {
        success: false,
        error:
          "Missing required fields: walletAddress, selectedEmoji, voteDate",
      }
    }

    // Validate wallet address format
    if (!isValidAddress(walletAddress)) {
      return {
        success: false,
        error: "Invalid wallet address format",
      }
    }

    // Verify user voted for this emoji on this date
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("*")
      .eq("fid", session.user.fid)
      .eq("emoji", selectedEmoji)
      .eq("vote_date", voteDate)
      .single()

    if (voteError || !vote) {
      return {
        success: false,
        error:
          "Vote not found. You can only mint NFTs for emojis you voted for.",
      }
    }

    // Check if already minted
    const { data: existingMint } = await supabase
      .from("vote_nfts")
      .select("*")
      .eq("vote_id", vote.id)
      .single()

    if (existingMint) {
      return {
        success: false,
        error: "NFT already minted for this vote",
      }
    }

    // Debug environment variables - MORE DETAILED
    console.log("=== FULL ENVIRONMENT DEBUG ===")
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("All THIRDWEB env vars:")
    Object.keys(process.env)
      .filter((key) => key.includes("THIRDWEB"))
      .forEach((key) => {
        console.log(
          `  ${key}:`,
          process.env[key] ? `${process.env[key].slice(0, 10)}...` : "MISSING"
        )
      })
    console.log("All NEXT_PUBLIC env vars:")
    Object.keys(process.env)
      .filter((key) => key.includes("NEXT_PUBLIC"))
      .forEach((key) => {
        console.log(
          `  ${key}:`,
          process.env[key] ? `${process.env[key].slice(0, 10)}...` : "MISSING"
        )
      })
    console.log("================================")

    // Dynamic import to avoid client-side issues
    const { createThirdwebClient, getContract } = await import("thirdweb")
    const { generateMintSignature } = await import("thirdweb/extensions/erc721")
    const { privateKeyToAccount } = await import("thirdweb/wallets")
    const { base, baseSepolia } = await import("thirdweb/chains")

    // Create client and account
    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    })

    if (!process.env.THIRDWEB_PRIVATE_KEY) {
      return {
        success: false,
        error: "THIRDWEB_PRIVATE_KEY environment variable is not set",
      }
    }

    const account = privateKeyToAccount({
      client,
      privateKey: process.env.THIRDWEB_PRIVATE_KEY,
    })

    // Get contract
    const chain = process.env.NODE_ENV === "production" ? base : baseSepolia
    const contract = getContract({
      client,
      chain,
      address: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
    })

    // Generate mint signature
    const mintSignature = await generateMintSignature({
      account,
      contract,
      mintRequest: {
        to: walletAddress,
        metadata: {
          name: `${selectedEmoji} ${voteDate}`,
          description: `Vote for ${selectedEmoji} on ${voteDate} from emoji.today`,
          image: `${
            process.env.NEXT_PUBLIC_URL || "https://emoji.today"
          }/api/participation?emoji=${encodeURIComponent(
            selectedEmoji
          )}&date=${voteDate}`,
          attributes: [
            { trait_type: "Emoji", value: selectedEmoji },
            { trait_type: "Vote Date", value: voteDate },
            { trait_type: "Platform", value: "emoji.today" },
            { trait_type: "Voter FID", value: session.user.fid.toString() },
          ],
        },
        price: "1000000000000000", // 0.001 ETH in wei
      },
    })

    // Debug: Log the actual signature payload
    console.log("=== MINT SIGNATURE DEBUG ===")
    console.log("Raw payload:", mintSignature.payload)
    console.log("Payload price field:", mintSignature.payload.price)
    console.log("Payload price type:", typeof mintSignature.payload.price)
    console.log("=============================")

    // Fix: Better BigInt serialization that preserves the actual values
    const serializePayload = (obj: any): any => {
      if (typeof obj === "bigint") {
        return obj.toString()
      }
      if (Array.isArray(obj)) {
        return obj.map(serializePayload)
      }
      if (obj && typeof obj === "object") {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = serializePayload(value)
        }
        return result
      }
      return obj
    }

    const serializedPayload = serializePayload(mintSignature.payload)

    console.log("=== SERIALIZED PAYLOAD DEBUG ===")
    console.log("Serialized payload:", serializedPayload)
    console.log("Serialized price field:", serializedPayload.price)
    console.log("=================================")

    // Store mint record in database
    const { error: insertError } = await supabase.from("vote_nfts").insert({
      vote_id: vote.id,
      wallet_address: walletAddress,
      signature_payload: serializedPayload,
      signature: mintSignature.signature,
      mint_price_usdc: 0.001, // 0.001 ETH
    })

    if (insertError) {
      console.error("Failed to store mint record:", insertError)
      console.error("Error details:", JSON.stringify(insertError, null, 2))

      // Check if it's a duplicate key error
      if (
        insertError.message?.includes("duplicate") ||
        insertError.code === "23505"
      ) {
        return {
          success: false,
          error:
            "Did you already mint today's vote? Each vote can only be minted once.",
        }
      }

      return {
        success: false,
        error: "Failed to store mint record. Please try again.",
      }
    }

    return {
      success: true,
      signature: mintSignature,
    }
  } catch (error) {
    console.error("Error generating mint signature:", error)
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
