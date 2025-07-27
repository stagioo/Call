"use client";
import { AppSidebar } from "@/components/app/section/_components/app-sidebar";
import { ModalContact } from "@/components/app/section/_components/modal-contact";
import { Providers } from "@/components/providers";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@call/ui/components/button";
import { Separator } from "@call/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@call/ui/components/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const sectionMap = [
  { path: "/app/call", title: "Call" },
  { path: "/app/teams", title: "Teams" },
  { path: "/app/contact", title: "Contact" },
  { path: "/app/schedule", title: "Schedule" },
  { path: "/app/notifications", title: "Notifications" },
  { path: "/app/profile", title: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { onOpen } = useModal();

  const selectedSection =
    sectionMap.find((s) => pathname?.startsWith(s.path))?.title || "Call";

  const handleSectionSelect = (title: string) => {
    if (title === "Schedule") {
      toast.info("This section will be available soon.");
      return;
    }
    const section = sectionMap.find((s) => s.title === title);
    if (section) {
      router.push(section.path);
    }
  };

  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar
          selectedSection={selectedSection}
          onSectionSelect={handleSectionSelect}
        />
        <SidebarInset>
          <header className="dark:border-sidebar border-border flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full items-center justify-between gap-2 px-4">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
              </div>
              <div>
                {selectedSection === "Call" && (
                  <Button onClick={() => onOpen("start-call")}>
                    Start Call
                  </Button>
                )}
                {selectedSection === "Teams" && (
                  <Button onClick={() => onOpen("create-team")}>
                    Create Team
                  </Button>
                )}
                {selectedSection === "Contact" && (
                  <Button onClick={() => onOpen("create-contact")}>
                    Add Contact
                  </Button>
                )}
                {selectedSection === "Schedule" && (
                  <Button>Schedule Meeting</Button>
                )}
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </Providers>
  );
}
