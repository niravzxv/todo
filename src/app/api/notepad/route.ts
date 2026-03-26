import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Same dual-mode storage as the tasks API
const REDIS_URL =
  process.env.todo_KV_REST_API_URL ||
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.todo_KV_REST_API_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);
const ON_VERCEL = process.env.VERCEL === "1";
const REDIS_KEY = "notepad";

const LOCAL_FILE = ON_VERCEL
  ? "/tmp/notepad.json"
  : path.join(process.cwd(), "data", "notepad.json");

async function readContent(): Promise<string> {
  if (USE_REDIS) {
    const res = await fetch(REDIS_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", REDIS_KEY]),
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.result) return "";
    try {
      const parsed = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
      return typeof parsed?.content === "string" ? parsed.content : "";
    } catch {
      return "";
    }
  }

  try {
    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed?.content === "string" ? parsed.content : "";
  } catch {
    return "";
  }
}

async function writeContent(content: string): Promise<void> {
  const payload = JSON.stringify({ content });

  if (USE_REDIS) {
    await fetch(REDIS_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["SET", REDIS_KEY, payload]),
    });
    return;
  }

  fs.writeFileSync(LOCAL_FILE, payload, "utf-8");
}

export async function GET() {
  const content = await readContent();
  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = typeof body.content === "string" ? body.content : "";
  await writeContent(content);
  return NextResponse.json({ ok: true });
}
