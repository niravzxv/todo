"use client";

import { motion } from "framer-motion";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";
import { TabType, Task } from "@/app/types";

interface TabNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tasks: Task[];
}

const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "pending",
    label: "Pending",
    icon: <Clock className="w-4 h-4" />,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "in_progress",
    label: "In Progress",
    icon: <Loader2 className="w-4 h-4" />,
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "from-emerald-400 to-teal-500",
  },
];

export default function TabNav({ activeTab, onTabChange, tasks }: TabNavProps) {
  const getCount = (tab: TabType) => tasks.filter((t) => t.status === tab).length;

  return (
    <div className="flex gap-2 p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = getCount(tab.id);

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} shadow-lg`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-2 ${isActive ? "text-white" : "text-white/60 hover:text-white/80"}`}>
              {tab.id === "in_progress" && isActive ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {tab.icon}
                </motion.span>
              ) : (
                tab.icon
              )}
              <span className="hidden sm:inline">{tab.label}</span>
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                    isActive ? "bg-white/30 text-white" : "bg-white/20 text-white/70"
                  }`}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
