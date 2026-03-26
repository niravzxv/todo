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

export type TabType = "pending" | "in_progress" | "completed" | "notepad";
