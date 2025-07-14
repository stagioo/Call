// This file defines the main page layout for the app section, including the sidebar, header, breadcrumbs, and main content area.
"use client";
import { AppSidebar } from "@/components/app/section/_components/app-sidebar";
import { Button } from "@call/ui/components/button";
import { Separator } from "@call/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@call/ui/components/sidebar";
import CallSection from "@/components/app/section/call-section";
import TeamSection from "@/components/app/section/team-section";
import ContactSection from "@/components/app/section/contact-section";
import ScheduleSection from "@/components/app/section/schedule-section";
import { useState } from "react";

export default function Page() {
  const [selectedSection, setSelectedSection] = useState("Call");

  let SectionComponent = null;
  if (selectedSection === "Call") SectionComponent = <CallSection />;
  else if (selectedSection === "Teams") SectionComponent = <TeamSection />;
  else if (selectedSection === "Contact") SectionComponent = <ContactSection />;
  else if (selectedSection === "Schedule") SectionComponent = <ScheduleSection />;

  return (
    // SidebarProvider manages sidebar state for the layout
    <SidebarProvider>
      {/* Main sidebar for navigation and user info */}
      <AppSidebar
        selectedSection={selectedSection}
        onSectionSelect={setSelectedSection}
      />
      {/* SidebarInset wraps the main content area, including header and page content */}
      <SidebarInset>
        {/* Header with sidebar trigger, separator, and breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center">
              <SidebarTrigger className="-ml-1" />

              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />

              <p>{selectedSection}</p>
            </div>
            <div>
              <Button>Start Call</Button>
            </div>
          </div>
        </header>
        {/* Main content area with two sections: a grid and a flexible content box */}
        <div className="flex flex-1 flex-col gap-4 border p-4">
          {SectionComponent}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
