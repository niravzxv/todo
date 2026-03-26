"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo, Sparkles, RefreshCw } from "lucide-react";
import TabNav from "@/app/components/TabNav";
import TaskCard from "@/app/components/TaskCard";
import AddTaskModal from "@/app/components/AddTaskModal";
import DownloadButton from "@/app/components/DownloadButton";
import { Task, TabType } from "@/app/types";

const tabDirection: Record<TabType, number> = {
  pending: 0,
  in_progress: 1,
  completed: 2,
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [prevTab, setPrevTab] = useState<TabType>("pending");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/tasks");
      const data: Task[] = await res.json();
      setTasks(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTabChange = (tab: TabType) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  const handleAddTask = async (title: string, description: string, project: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, project }),
    });
    if (!res.ok) throw new Error("Failed to add task");
    await fetchTasks(true);
  };

  const handleStart = async (id: string) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "start" }),
    });
    await fetchTasks(true);
    handleTabChange("in_progress");
  };

  const handleComplete = async (id: string) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "complete" }),
    });
    await fetchTasks(true);
    handleTabChange("completed");
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await fetchTasks(true);
  };

  const filteredTasks = tasks.filter((t) => t.status === activeTab);
  const direction = tabDirection[activeTab] - tabDirection[prevTab];

  const emptyMessages: Record<TabType, { title: string; subtitle: string }> = {
    pending: {
      title: "No pending tasks",
      subtitle: 'Click "+ Add Task" to create your first task',
    },
    in_progress: {
      title: "Nothing in progress",
      subtitle: "Start a pending task to see it here",
    },
    completed: {
      title: "No completed tasks yet",
      subtitle: "Complete tasks to see them here",
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 relative overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-purple-700/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <ListTodo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                TaskFlow
                <Sparkles className="w-5 h-5 text-violet-400" />
              </h1>
              <p className="text-white/45 text-sm">Track your work, stay on top of everything</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/40 text-xs">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
            </p>
            <button
              onClick={() => fetchTasks(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors duration-200"
            >
              <motion.div
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: "linear" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <TabNav activeTab={activeTab} onTabChange={handleTabChange} tasks={tasks} />
        </motion.div>

        {/* Completed Tab Header */}
        {activeTab === "completed" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-4"
          >
            <p className="text-white/50 text-sm">
              {filteredTasks.length} completed task{filteredTasks.length !== 1 ? "s" : ""}
            </p>
            <DownloadButton tasks={filteredTasks} />
          </motion.div>
        )}

        {/* Task List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-400 rounded-full"
            />
            <p className="text-white/40 text-sm">Loading tasks...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 gap-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                    <ListTodo className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/50 font-medium">{emptyMessages[activeTab].title}</p>
                  <p className="text-white/30 text-sm text-center max-w-xs">{emptyMessages[activeTab].subtitle}</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onStart={handleStart}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Floating Add Button — only on Pending tab */}
        <AnimatePresence>
          {activeTab === "pending" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setModalOpen(true)}
              className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-shadow duration-300 z-30"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTask}
      />
    </main>
  );
}
