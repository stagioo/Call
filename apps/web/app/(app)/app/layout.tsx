"use client";
import { AppSidebar } from "@/components/app/section/_components/app-sidebar";
import { CreateCallModal } from "@/components/app/section/_components/create-call-modal";
import { CreateTeamModal } from "@/components/app/section/_components/create-team-modal";
import { ModalContact } from "@/components/app/section/_components/modal-contact";
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
import { Providers } from "@/components/providers";

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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  // Find the section that matches the current path
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

  const handleTeamCreated = () => {
    // Refresh the page to show the new team
    window.location.reload();
  };

  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar
          selectedSection={selectedSection}
          onSectionSelect={handleSectionSelect}
        />
        <SidebarInset>
          <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full items-center justify-between gap-2 px-4">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                {/* Section title can be rendered by each page */}
              </div>
              <div>
                {selectedSection === "Call" && (
                  <Button onClick={() => setShowCallModal(true)}>
                    Start Call
                  </Button>
                )}
                {selectedSection === "Teams" && (
                  <Button onClick={() => setShowCreateTeamModal(true)}>
                    Create Team
                  </Button>
                )}
                {selectedSection === "Contact" && (
                  <Button onClick={() => setShowContactModal(true)}>
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
          {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="relative">
                <ModalContact onClose={() => setShowContactModal(false)} />
              </div>
            </div>
          )}
          {showCreateTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="relative">
                <CreateTeamModal
                  onClose={() => setShowCreateTeamModal(false)}
                  onTeamCreated={handleTeamCreated}
                />
              </div>
            </div>
          )}
          {showCallModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="relative">
                <CreateCallModal onClose={() => setShowCallModal(false)} />
              </div>
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </Providers>
  );
}
