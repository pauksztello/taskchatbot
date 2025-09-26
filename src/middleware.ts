// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();

    const existing = req.cookies.get("sid")?.value; // NOTE: This is not secure, anyone can set any value for a cookie

    if (!existing) {
      const uuid =
        (globalThis.crypto as any)?.randomUUID?.() ?? // NOTE: What is this type nightmare? Also never use "any"
        `${Date.now()}-${Math.floor(Math.random() * 1e9)}`; //NOTE: Unreadable

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
    console.error("middleware error:", err); 
    return NextResponse.next(); // NOTE: why do you return response here if you get an error?
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
