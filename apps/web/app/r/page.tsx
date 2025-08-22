"use client";

import { LoadingButton } from "@call/ui/components/loading-button";
import { cn } from "@call/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, MotionConfig, type Transition } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const MAX_NAME_LENGTH = 20;
const MAX_MEETING_ID_LENGTH = 6;

const errors: Record<string, string> = {
  name: `Name must be less than ${MAX_NAME_LENGTH} characters`,
  meetingId: `Meeting ID must be less than ${MAX_MEETING_ID_LENGTH} characters.`,
};

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
  exit: { opacity: 0, y: 20 },
};

const formSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH).trim(),
  meetingId: z
    .string()
    .min(1)
    .max(MAX_MEETING_ID_LENGTH)
    .optional()
    .transform((val) => val?.trim()),
});

export default function MeetingForm() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Join");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      meetingId: "",
    },
    shouldUnregister: false,
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (activeTab === "Join") {
      joinMeeting(data);
    } else {
      startMeeting(data);
    }
  };

  function joinMeeting(data: z.infer<typeof formSchema>) {
    const { name, meetingId } = data;
    if (!meetingId) {
      form.setError("meetingId", { message: errors.meetingId });
      return;
    }

    const isUrl = meetingId.startsWith("https://");
    let meetingIdOrUrl = meetingId;

    if (isUrl) {
      const url = new URL(meetingId);
      meetingIdOrUrl = url.pathname.split("/").pop() ?? "";
    }

    if (!meetingIdOrUrl) {
      form.setError("meetingId", { message: errors.meetingId });
      return;
    }

    if (meetingIdOrUrl.length > 6) {
      form.setError("meetingId", { message: errors.meetingId });
      return;
    }

    console.log(data);
    form.reset();
  }

  function startMeeting(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  const handleTabChange = (tab: (typeof tabs)[number]) => {
    setActiveTab(tab);
  };

  return (
    <MotionConfig transition={transition}>
      <div className="bg-sidebar-inset flex min-h-screen items-center justify-center">
        <div className="min-h-60 w-full max-w-md">
          <div className="w-full">
            <div className="border-sidebar-foreground/10 flex gap-2 border-b py-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={cn(
                    "relative flex-1 rounded-lg py-2 text-sm font-medium transition",
                    activeTab === tab
                      ? "text-white"
                      : "text-gray-500 hover:text-white"
                  )}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="bg-sidebar border-sidebar-foreground/10 absolute inset-0 rounded-lg border"
                      transition={{ type: "spring", duration: 1 }}
                    />
                  )}
                  <motion.span
                    layoutId={`${tab}-label`}
                    className="relative z-10"
                  >
                    {tab} Meeting
                  </motion.span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <motion.form
                onSubmit={form.handleSubmit(onSubmit)}
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
                <div>
                  <motion.input
                    layoutId="name"
                    type="text"
                    placeholder="Display name"
                    className={cn(
                      "border-sidebar-foreground/10 bg-sidebar-foreground/10 text-sidebar-foreground-foreground z-50 h-10 w-full rounded-lg border px-4 py-2 focus:outline-none",
                      form.formState.errors.name &&
                        "border-primary-red bg-primary-red/10"
                    )}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <motion.span
                      layoutId="name-label"
                      className="text-primary-red -z-10 text-xs"
                    >
                      {form.formState.errors.name?.message}
                    </motion.span>
                  )}
                </div>

                <div className="z-0">
                  <motion.input
                    key={`${activeTab}-meetingId`}
                    type="text"
                    placeholder="Meeting ID"
                    layoutId="meetingId"
                    className={cn(
                      "border-sidebar-foreground/10 bg-sidebar-foreground/10 text-sidebar-foreground-foreground z-[3] h-10 w-full rounded-lg border px-4 py-2 focus:outline-none",
                      activeTab !== "Join" && "hidden",
                      form.formState.errors.meetingId &&
                        "border-primary-red bg-primary-red/10"
                    )}
                    {...form.register("meetingId")}
                  />
                  {activeTab === "Join" && form.formState.errors.meetingId && (
                    <motion.span
                      layoutId="meetingId-label"
                      className="text-primary-red -z-10 text-xs"
                    >
                      {form.formState.errors.meetingId?.message}
                    </motion.span>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  layoutId="submit"
                  className="text-sidebar-foreground-foreground border-primary-blue bg-primary-blue hover:bg-primary-blue/80 z-10 h-10 w-full rounded-lg border px-4 py-2.5"
                >
                  {activeTab === "Start" ? "Start Meeting" : "Join Meeting"}
                </LoadingButton>
              </motion.form>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
