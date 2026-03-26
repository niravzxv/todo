"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, FileText, AlignLeft, FolderOpen } from "lucide-react";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, project: string) => Promise<void>;
}

export default function AddTaskModal({ open, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAdd(title.trim(), description.trim(), project.trim());
      setTitle("");
      setDescription("");
      setProject("");
      onClose();
    } catch {
      setError("Failed to add task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setTitle("");
    setDescription("");
    setProject("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">New Task</h2>
                  <p className="text-white/50 text-sm mt-0.5">Add a task to your pending list</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                    <FileText className="w-4 h-4" />
                    Task Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setError(""); }}
                    placeholder="e.g. Design homepage mockup"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-violet-400/60 focus:bg-white/10 transition-all duration-200 text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                    <FolderOpen className="w-4 h-4" />
                    Project <span className="text-white/30 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    maxLength={60}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-violet-400/60 focus:bg-white/10 transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                    <AlignLeft className="w-4 h-4" />
                    Description <span className="text-white/30 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details about the task..."
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-violet-400/60 focus:bg-white/10 transition-all duration-200 text-sm resize-none"
                  />
                  <p className="text-right text-xs text-white/30 mt-1">{description.length}/500</p>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading || !title.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {loading ? "Adding..." : "Add Task"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
