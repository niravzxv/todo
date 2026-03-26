"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Task } from "@/app/types";

interface DownloadButtonProps {
  tasks: Task[];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDuration(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function DownloadButton({ tasks }: DownloadButtonProps) {
  const [done, setDone] = useState(false);

  const handleDownload = () => {
    if (tasks.length === 0) return;

    const rows = tasks.map((task) => ({
      "Task ID": task.id,
      "Project": task.project || "—",
      "Title": task.title,
      "Description": task.description || "—",
      "Created At": formatDate(task.createdAt),
      "Started At": formatDate(task.startedAt),
      "Completed At": formatDate(task.completedAt),
      "Duration": getDuration(task.startedAt, task.completedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 30 },
      { wch: 40 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Completed Tasks");

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `completed-tasks-${dateStr}.xlsx`);

    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <motion.button
      onClick={handleDownload}
      disabled={tasks.length === 0}
      whileHover={{ scale: tasks.length > 0 ? 1.03 : 1 }}
      whileTap={{ scale: tasks.length > 0 ? 0.97 : 1 }}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-lg hover:shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
    >
      {done ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Downloaded!
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export XLSX ({tasks.length})
        </>
      )}
    </motion.button>
  );
}
