import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

const SESSION_DAYS = 30;

/**
 * The optimistic check: a browser with no session cookie goes to the sign-in
 * page. Whether the session is real is checked by every page and action
 * (src/services/auth.ts); this never touches the database. A browser that
 * keeps using the app keeps its cookie for another thirty days.
 */
export const proxy = (request: NextRequest) => {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return response;
};

export const config = {
  // Everything but the sign-in page and what a browser fetches before it (assets, icons, manifest).
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest).*)"],
};
