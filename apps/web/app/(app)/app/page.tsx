"use client";
import SideBar from "@/components/app/sideBar";
import CallsSection from "@/components/app/sections/CallSection";
import TeamsSection from "@/components/app/sections/TeamsSection";
import FriendsSection from "@/components/app/sections/FriendsSection";
import ScheduleSection from "@/components/app/sections/ScheduleSection";
import { SidebarInset, SidebarProvider } from "@call/ui/components/sidebar";
import { useState } from "react";

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  calls: CallsSection,
  teams: TeamsSection,
  contacts: FriendsSection,
  schedule: ScheduleSection,
};

const DEFAULT_SECTION = "calls";

const Page = () => {
  const [section, setSection] = useState<string>(DEFAULT_SECTION);

  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
  };

  const SectionComponent: React.ComponentType =
    SECTION_COMPONENTS[section] || CallsSection;

  return (
    <SidebarProvider>
      <SideBar section={section} onSectionChange={handleSectionChange} />
      <SidebarInset className="bg-[#111111] py-3">
        <SectionComponent />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Page;
