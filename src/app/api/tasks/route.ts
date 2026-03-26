import { NextRequest, NextResponse } from "next/server";
import { readTasks, writeTasks, Task } from "@/lib/taskStorage";

export type { Task };

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
