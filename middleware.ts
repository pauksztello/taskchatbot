// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const SID = req.cookies.get("sid")?.value;
  if (!SID) {
    res.cookies.set("sid", crypto.randomUUID(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180, // 180 days
    });
  }

  return res;
}

// Exclude static assets for perf
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
