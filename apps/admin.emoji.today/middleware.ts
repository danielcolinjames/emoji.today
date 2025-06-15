import { NextResponse, type NextRequest } from "next/server"

// Basic Auth middleware. Protects all routes in the admin app.
export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get("authorization")
  const ADMIN_USER = process.env.ADMIN_USER
  const ADMIN_PASS = process.env.ADMIN_PASS

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error("ADMIN_USER / ADMIN_PASS env vars are not set")
    return new NextResponse("Admin credentials not configured", { status: 500 })
  }

  // Not provided → ask for credentials
  if (!basicAuth) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    })
  }

  // Verify creds
  const authValue = basicAuth.split(" ")[1]
  const [user, pass] = Buffer.from(authValue, "base64").toString().split(":")

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return NextResponse.next()
  }

  // Fail → re-prompt
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  })
}

export const config = {
  matcher: "/:path*",
}
