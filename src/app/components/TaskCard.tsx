"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle, Trash2, Clock, Calendar, Timer, Tag, FolderOpen } from "lucide-react";
import { Task } from "@/app/types";

interface TaskCardProps {
  task: Task;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string | null, end: string | null) {
  if (!start) return "—";
  const endTime = end ? new Date(end).getTime() : Date.now();
  const diff = endTime - new Date(start).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() => formatDuration(startedAt, null));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatDuration(startedAt, null));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="font-mono text-blue-300 font-semibold">{elapsed}</span>
  );
}

const statusStyles = {
  pending: "border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5",
  in_progress: "border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
  completed: "border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
};

const badgeStyles = {
  pending: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  in_progress: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  completed: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
};

export default function TaskCard({ task, onStart, onComplete, onDelete, index }: TaskCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: deleting ? 0 : 1, y: 0, scale: deleting ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative rounded-2xl border backdrop-blur-md p-5 shadow-lg ${statusStyles[task.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyles[task.status]}`}>
              <Tag className="w-3 h-3" />
              {task.id}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[task.status]}`}>
              {task.status === "pending" ? "Pending" : task.status === "in_progress" ? "In Progress" : "Completed"}
            </span>
            {task.project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-400/10 text-violet-300 border-violet-400/25">
                <FolderOpen className="w-3 h-3" />
                {task.project}
              </span>
            )}
          </div>

          <h3 className="text-white font-semibold text-base leading-snug mb-1 truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{task.description}</p>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Calendar className="w-3.5 h-3.5" />
          <span>Created: {formatDate(task.createdAt)}</span>
        </div>

        {task.startedAt && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span>Started: {formatDate(task.startedAt)}</span>
          </div>
        )}

        {task.completedAt && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed: {formatDate(task.completedAt)}</span>
          </div>
        )}

        {task.status === "in_progress" && task.startedAt && (
          <div className="flex items-center gap-2 text-xs">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white/50">Elapsed: </span>
            <LiveTimer startedAt={task.startedAt} />
          </div>
        )}

        {task.status === "completed" && task.startedAt && task.completedAt && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Duration: <span className="text-emerald-300 font-semibold font-mono">{formatDuration(task.startedAt, task.completedAt)}</span></span>
          </div>
        )}
      </div>

      {(task.status === "pending" || task.status === "in_progress") && (
        <div className="mt-4 flex gap-2">
          {task.status === "pending" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStart(task.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-blue-500/25 hover:shadow-lg transition-all duration-200"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Work
            </motion.button>
          )}

          {task.status === "in_progress" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onComplete(task.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-emerald-500/25 hover:shadow-lg transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
