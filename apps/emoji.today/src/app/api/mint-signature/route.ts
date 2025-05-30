import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { supabase } from "@/lib/supabase"

interface MintRequest {
  walletAddress: string
  selectedEmoji: string
  voteDate: string
}

// Validate wallet address
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

// Basic rate limiting (in-memory, resets on server restart)
const rateLimiter = new Map<string, number[]>()
const RATE_LIMIT = 10 // 10 mints per hour per user
const WINDOW = 60 * 60 * 1000 // 1 hour

function checkRateLimit(fid: string): boolean {
  const now = Date.now()
  const userLimits = rateLimiter.get(fid) || []

  // Remove old entries
  const validLimits = userLimits.filter((time: number) => now - time < WINDOW)

  if (validLimits.length >= RATE_LIMIT) {
    return false // Rate limited
  }

  validLimits.push(now)
  rateLimiter.set(fid, validLimits)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.fid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    if (!checkRateLimit(session.user.fid.toString())) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    // Parse request body with size limit
    const contentLength = request.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 1024) {
      // 1KB limit
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      )
    }

    let body: MintRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { walletAddress, selectedEmoji, voteDate } = body

    // Validate required fields
    if (!walletAddress || !selectedEmoji || !voteDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: walletAddress, selectedEmoji, voteDate",
        },
        { status: 400 }
      )
    }

    // Validate field formats
    if (!isValidAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      )
    }

    if (!isValidDate(voteDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Validate emoji (basic check - not empty and reasonable length)
    if (selectedEmoji.length === 0 || selectedEmoji.length > 10) {
      return NextResponse.json(
        { error: "Invalid emoji format" },
        { status: 400 }
      )
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
      return NextResponse.json(
        {
          error:
            "Vote not found. You can only mint NFTs for emojis you voted for.",
        },
        { status: 403 }
      )
    }

    // Check if already minted
    const { data: existingMint } = await supabase
      .from("vote_nfts")
      .select("*")
      .eq("vote_id", vote.id)
      .single()

    if (existingMint) {
      return NextResponse.json(
        { error: "NFT already minted for this vote" },
        { status: 409 }
      )
    }

    // Validate environment variables
    const requiredEnvVars = [
      "NEXT_PUBLIC_THIRDWEB_CLIENT_ID",
      "THIRDWEB_SECRET_KEY",
      "THIRDWEB_PRIVATE_KEY",
      "NEXT_PUBLIC_NFT_CONTRACT_ADDRESS",
    ]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing ${envVar}`)
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        )
      }
    }

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

    const account = privateKeyToAccount({
      client,
      privateKey: process.env.THIRDWEB_PRIVATE_KEY!,
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

    // Store mint record in database (prevents duplicate mints)
    const { error: insertError } = await supabase.from("vote_nfts").insert({
      vote_id: vote.id,
      wallet_address: walletAddress,
      signature_payload: JSON.parse(
        JSON.stringify(mintSignature.payload, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      ),
      signature: mintSignature.signature,
      mint_price_usdc: 0.001, // 0.001 ETH
    })

    if (insertError) {
      console.error("Failed to store mint record:", insertError)

      // Check if it's a duplicate key error
      if (
        insertError.message?.includes("duplicate") ||
        insertError.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "Did you already mint today's vote? Each vote can only be minted once.",
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: "Failed to store mint record. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      signature: mintSignature,
    })
  } catch (error) {
    console.error("Error generating mint signature:", error)

    // Don't expose internal errors in production
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? error instanceof Error
          ? error.message
          : "Unknown error"
        : "Failed to generate mint signature"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
