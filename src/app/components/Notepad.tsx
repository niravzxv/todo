"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NotebookPen, Save, CheckCircle2, Loader2, Trash2 } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function Notepad() {
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");

  const saveContent = useCallback(async (text: string) => {
    if (text === lastSavedRef.current) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/notepad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        lastSavedRef.current = text;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notepad");
        const data = await res.json();
        setContent(data.content ?? "");
        lastSavedRef.current = data.content ?? "";
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    setSaveStatus("idle");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveContent(value);
    }, 1000);
  };

  const handleClear = async () => {
    if (!content) return;
    setContent("");
    await saveContent("");
  };

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveContent(content);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-teal-400" />
          <span className="text-white/60 text-sm font-medium">Scratchpad</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          <AnimatePresence mode="wait">
            {saveStatus === "saving" && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-white/40"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </motion.span>
            )}
            {saveStatus === "saved" && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </motion.span>
            )}
            {saveStatus === "error" && (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400"
              >
                Failed to save
              </motion.span>
            )}
          </AnimatePresence>

          {/* Manual save button */}
          <button
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            title="Save now"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={!content}
            title="Clear notepad"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-red-400 hover:bg-red-400/10 border border-white/10 hover:border-red-400/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Textarea */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full"
          />
          <p className="text-white/40 text-sm">Loading notepad...</p>
        </div>
      ) : (
        <div className="relative">
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="Start typing your notes here... Auto-saves as you type."
            className="w-full min-h-[420px] px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-teal-400/40 focus:bg-white/8 transition-all duration-200 text-sm leading-relaxed resize-y font-mono"
            spellCheck
          />
        </div>
      )}

      {/* Footer stats */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-white/25 px-1">
          <span>{charCount} characters</span>
          <span>{wordCount} words</span>
        </div>
      )}
    </motion.div>
  );
}
