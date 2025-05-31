import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PRODUCTION_DOMAINS = [
  "emoji.today",
  "vote.emoji.today",
  "www.emoji.today",
]

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "emoji-admin-2024"

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  // Production domain protection
  if (PRODUCTION_DOMAINS.some((domain) => hostname.includes(domain))) {
    // Only allow specific admin operations in production
    if (
      url.pathname.startsWith("/api/admin") ||
      url.pathname.startsWith("/admin")
    ) {
      const auth = request.headers.get("authorization")
      const adminSecret = request.headers.get("x-admin-secret")

      if (!auth && !adminSecret) {
        return new NextResponse("Unauthorized - Production environment", {
          status: 401,
        })
      }

      // Check admin password
      if (adminSecret !== ADMIN_PASSWORD) {
        return new NextResponse("Invalid admin credentials", { status: 403 })
      }
    }

    // Log all production requests for monitoring
    console.log(`Production request: ${hostname}${url.pathname}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
