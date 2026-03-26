import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function computeToken(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifySession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.APP_SECRET;

  // If APP_PASSWORD is not configured, the app is open (no login required)
  if (!password) return true;

  if (!cookieValue) return false;

  const expected = await computeToken(password, secret ?? "default-secret");
  return cookieValue === expected;
}

export async function POST(req: NextRequest) {
  const password = process.env.APP_PASSWORD;

  // If no password configured, just redirect home
  if (!password) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json();
  const submitted = body.password ?? "";

  if (submitted !== password) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const secret = process.env.APP_SECRET ?? "default-secret";
  const token = await computeToken(password, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
