import { NextRequest, NextResponse } from "next/server";
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

// ---------------------------------------------------------------------------
// Storage layer
//   1. Upstash Redis   — when UPSTASH_REDIS_REST_URL + TOKEN are set (Vercel prod)
//   2. /tmp/tasks.json — on Vercel without Redis (ephemeral, but no crash)
//   3. data/tasks.json — local development
// ---------------------------------------------------------------------------

// Vercel prefixes env vars with the project name (e.g. todo_KV_REST_API_URL).
// We check both the prefixed and standard names so the app works in any setup.
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
const REDIS_KEY = "tasks";

// On Vercel only /tmp is writable; locally use the committed data/ directory.
const LOCAL_FILE = ON_VERCEL
  ? "/tmp/tasks.json"
  : path.join(process.cwd(), "data", "tasks.json");

async function readTasks(): Promise<Task[]> {
  if (USE_REDIS) {
    const res = await fetch(`${REDIS_URL}/get/${REDIS_KEY}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.result) return [];
    const value = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
    return Array.isArray(value) ? value : [];
  }

  try {
    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

async function writeTasks(tasks: Task[]): Promise<void> {
  if (USE_REDIS) {
    await fetch(`${REDIS_URL}/set/${REDIS_KEY}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: JSON.stringify(tasks) }),
    });
    return;
  }

  fs.writeFileSync(LOCAL_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function GET() {
  const tasks = await readTasks();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tasks = await readTasks();

  const taskNumber =
    tasks.length > 0 ? Math.max(...tasks.map((t) => t.taskNumber)) + 1 : 1;

  const newTask: Task = {
    id: `task#${taskNumber}`,
    taskNumber,
    title: body.title?.trim() || "Untitled Task",
    description: body.description?.trim() || "",
    project: body.project?.trim() || null,
    status: "pending",
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };

  tasks.push(newTask);
  await writeTasks(tasks);

  return NextResponse.json(newTask, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body as { id: string; action: "start" | "complete" };

  const tasks = await readTasks();
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = tasks[index];

  if (action === "start" && task.status === "pending") {
    task.status = "in_progress";
    task.startedAt = new Date().toISOString();
  } else if (action === "complete" && task.status === "in_progress") {
    task.status = "completed";
    task.completedAt = new Date().toISOString();
  } else {
    return NextResponse.json(
      { error: "Invalid action for current status" },
      { status: 400 }
    );
  }

  tasks[index] = task;
  await writeTasks(tasks);

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const tasks = await readTasks();
  const filtered = tasks.filter((t) => t.id !== id);

  if (filtered.length === tasks.length) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await writeTasks(filtered);
  return NextResponse.json({ success: true });
}
