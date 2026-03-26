import fs from "fs";
import path from "path";

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  project: string | null;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const REDIS_URL =
  process.env.todo_KV_REST_API_URL ||
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.todo_KV_REST_API_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;
export const USE_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);
const ON_VERCEL = process.env.VERCEL === "1";
const REDIS_KEY = "tasks";

const LOCAL_FILE = ON_VERCEL
  ? "/tmp/tasks.json"
  : path.join(process.cwd(), "data", "tasks.json");

export async function readTasks(): Promise<Task[]> {
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
    if (!json.result) return [];
    try {
      const parsed =
        typeof json.result === "string" ? JSON.parse(json.result) : json.result;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  try {
    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export async function writeTasks(tasks: Task[]): Promise<void> {
  if (USE_REDIS) {
    await fetch(REDIS_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["SET", REDIS_KEY, JSON.stringify(tasks)]),
    });
    return;
  }

  fs.writeFileSync(LOCAL_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}
