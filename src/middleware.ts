import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();

    // Read current cookie
    const existing = req.cookies.get("sid")?.value;

    if (!existing) {
      // Generate UUID in Edge-safe way
      const uuid =
        (globalThis.crypto as any)?.randomUUID?.() ??
        `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

      // Set cookie with options (Edge middleware supports options)
      res.cookies.set("sid", uuid, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180, // 180 days
      });
    }

    return res;
  } catch (err) {
    // Never throw in middleware
    console.error("middleware error:", err);
    return NextResponse.next();
  }
}

// Exclude static assets; include API + pages
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
