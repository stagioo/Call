"use client";

import { cn } from "@call/ui/lib/utils";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from "motion/react";
import { useState } from "react";

const tabs = ["Join", "Start"] as const;

const transition: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 10,
  mass: 0.5,
  duration: 0.4,
};

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function MeetingForm() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Join");

  return (
    <MotionConfig transition={transition}>
      <div className="bg-sidebar-inset flex min-h-screen items-center justify-center">
        <div className="min-h-56 w-full max-w-md">
          <div className="w-full">
            <div className="border-sidebar-foreground/10 flex gap-2 border-b py-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative flex-1 rounded-lg py-2 text-sm font-medium transition",
                    activeTab === tab ? "text-white" : "text-gray-500"
                  )}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="bg-sidebar border-sidebar-foreground/10 absolute inset-0 rounded-lg border"
                      transition={{ type: "spring", duration: 1 }}
                    />
                  )}
                  <span className="relative z-10">{tab} Meeting</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <motion.form
                className="space-y-4 overflow-hidden"
                layout
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 80,
                    damping: 12,
                  },
                }}
              >
                <motion.input
                  layoutId="name"
                  type="text"
                  placeholder="Display name"
                  className="border-sidebar-foreground/10 bg-sidebar-foreground/10 text-sidebar-foreground-foreground h-10 w-full rounded-lg border px-4 py-2 focus:outline-none"
                />

                <AnimatePresence mode="popLayout">
                  {activeTab === "Join" && (
                    <motion.input
                      key={`meeting-id-${activeTab}`}
                      className="border-sidebar-foreground/10 bg-sidebar-foreground/10 text-sidebar-foreground-foreground h-10 w-full rounded-lg border px-4 py-2 focus:outline-none"
                      variants={formVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      placeholder="Meeting ID"
                    />
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  layoutId="submit"
                  className="text-sidebar-foreground-foreground border-sidebar-foreground/10 bg-sidebar z-10 h-10 w-full rounded-lg border px-4 py-2.5"
                >
                  {activeTab === "Start" ? "Start Meeting" : "Join Meeting"}
                </motion.button>
              </motion.form>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
