import { NextRequest, NextResponse } from "next/server";
import { readTasks, writeTasks, Task } from "@/lib/taskStorage";

interface ImportRow {
  title: string;
  description?: string;
  project?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows: ImportRow[] = body.tasks ?? [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
  }

  const existing = await readTasks();
  const existingTitles = new Set(
    existing.map((t) => t.title.trim().toLowerCase())
  );

  let nextNumber =
    existing.length > 0
      ? Math.max(...existing.map((t) => t.taskNumber)) + 1
      : 1;

  const newTasks: Task[] = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const title = row.title?.trim();
    if (!title) continue;

    if (existingTitles.has(title.toLowerCase())) {
      skipped.push(title);
      continue;
    }

    const task: Task = {
      id: `task#${nextNumber}`,
      taskNumber: nextNumber,
      title,
      description: row.description?.trim() || "",
      project: row.project?.trim() || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    newTasks.push(task);
    existingTitles.add(title.toLowerCase());
    nextNumber++;
  }

  if (newTasks.length > 0) {
    await writeTasks([...existing, ...newTasks]);
  }

  return NextResponse.json({
    imported: newTasks.length,
    skipped: skipped.length,
    skippedTitles: skipped,
  });
}
