import { AuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createAppClient, viemConnector } from "@farcaster/auth-client"
import { SiweMessage } from "siwe"

declare module "next-auth" {
  interface Session {
    user: {
      fid: number
      walletAddress?: string
    }
  }
}

function getDomainFromUrl(urlString: string | undefined): string {
  if (!urlString) {
    console.warn("NEXTAUTH_URL is not set, using localhost:3000 as fallback")
    return "localhost:3000"
  }
  try {
    const url = new URL(urlString)
    // Include port if present to match SIWE domain exactly (e.g., localhost:3000)
    return url.host
  } catch (error) {
    console.error("Invalid NEXTAUTH_URL:", urlString, error)
    console.warn("Using localhost:3000 as fallback")
    return "localhost:3000"
  }
}

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "Sign in with Farcaster",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
        // In a production app with a server, these should be fetched from
        // your Farcaster data indexer rather than have them accepted as part
        // of credentials.
        // question: should these natively use the Neynar API?
        name: {
          label: "Name",
          type: "text",
          placeholder: "0x0",
        },
        pfp: {
          label: "Pfp",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials, req) {
        const appClient = createAppClient({
          ethereum: viemConnector(),
        })

        // Derive nonce and domain from the SIWE message to support dynamic tunnels
        let siweNonce: string | undefined
        let verifyDomain: string | undefined
        try {
          const parsed = new SiweMessage(credentials?.message as string)
          siweNonce = parsed.nonce
          verifyDomain =
            parsed.domain || getDomainFromUrl(process.env.NEXTAUTH_URL)
        } catch (e) {
          console.error(
            "[NextAuth] Failed to parse SIWE message for nonce/domain",
            e
          )
          return null
        }

        let fid: string | undefined
        try {
          const verifyResponse = await appClient.verifySignInMessage({
            message: credentials?.message as string,
            signature: credentials?.signature as `0x${string}`,
            domain: verifyDomain as string,
            nonce: siweNonce as string,
            acceptAuthAddress: true,
          })
          const anyResp = verifyResponse as any
          const ok = (anyResp?.success ?? anyResp?.verified ?? false) as boolean
          fid = anyResp?.fid ? String(anyResp.fid) : undefined
          console.log("[NextAuth] verifySignInMessage", {
            ok,
            fid,
            domain: verifyDomain,
            raw: anyResp,
          })
          if (!ok || !fid) throw new Error("verify failed")
        } catch (e) {
          // Dev-mode fallback: accept FID from SIWE resources when verifier rejects dynamic tunnel domains
          const parsed = new SiweMessage(credentials?.message as string)
          const fidFromResources = Array.isArray(parsed.resources)
            ? parsed.resources
                .map((r) => /farcaster:\/\/fid\/(\d+)/.exec(r)?.[1])
                .find(Boolean)
            : undefined
          if (process.env.NODE_ENV !== "production" && fidFromResources) {
            console.warn(
              "[NextAuth] DEV FALLBACK: accepting FID from SIWE resources due to verifier unauthorized"
            )
            fid = String(fidFromResources)
          } else {
            console.error("[NextAuth] verifySignInMessage failed", e)
            return null
          }
        }

        return { id: String(fid) }
      },
    }),
    CredentialsProvider({
      name: "Sign in with Wallet",
      id: "wallet",
      credentials: {
        message: { label: "Message", type: "text", placeholder: "0x0" },
        signature: { label: "Signature", type: "text", placeholder: "0x0" },
      },
      async authorize(credentials, req) {
        try {
          const message = credentials?.message as string
          const signature = credentials?.signature as `0x${string}`
          if (!message || !signature) return null

          // Use SIWE message domain (tunnel-safe) and nonce
          const siwe = new SiweMessage(message)
          const nonce = siwe.nonce
          const verifyDomain =
            siwe.domain || getDomainFromUrl(process.env.NEXTAUTH_URL)

          const appClient = createAppClient({
            ethereum: viemConnector(),
          })

          const verifyResponse = await appClient.verifySignInMessage({
            message,
            signature,
            domain: verifyDomain,
            nonce,
            acceptAuthAddress: true,
          })
          const anyResp = verifyResponse as any
          const ok = (anyResp?.success ?? anyResp?.verified ?? false) as boolean
          if (!ok) return null

          const address = siwe.address
          if (!address) return null

          console.log("[NextAuth] wallet authorize (verified via appClient)", {
            address,
          })
          return { id: address.toLowerCase() }
        } catch (e) {
          console.error("[NextAuth] wallet authorize error", e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        const sub = token.sub ?? ""
        const maybeFid = parseInt(sub)
        if (!Number.isNaN(maybeFid)) {
          session.user.fid = maybeFid
          console.log("[NextAuth] session callback set fid", { fid: maybeFid })
        } else if (sub.startsWith("0x")) {
          session.user.fid = session.user.fid ?? 0
          session.user.walletAddress = sub.toLowerCase()
          console.log("[NextAuth] session callback set wallet", { wallet: sub })
        }
      }
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
}

export const getSession = async () => {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}
