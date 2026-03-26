import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session";

async function computeToken(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  const { pathname } = req.nextUrl;

  // Always allow login page and auth API regardless of password config
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If APP_PASSWORD is not configured, block access and redirect to login
  if (!password) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.APP_SECRET ?? "default-secret";
  const expected = await computeToken(password, secret);

  if (sessionCookie !== expected) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
