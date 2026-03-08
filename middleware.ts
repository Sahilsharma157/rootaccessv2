import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon.ico", "/images", "/fonts"]

// Quick check if cookie has a valid user ID (signed or unsigned)
function hasValidUserId(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  
  // Signed cookie format: uuid.signature
  if (cookieValue.includes(".")) {
    const userId = cookieValue.split(".")[0]
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  }
  
  // Legacy unsigned UUID
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cookieValue)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public prefixes (static assets, API)
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const cookieValue = request.cookies.get("user_id")?.value
  const isLoggedIn = hasValidUserId(cookieValue)

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    // If user is already logged in and visits login/signup, redirect to home
    if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/home", request.url))
    }
    return NextResponse.next()
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
