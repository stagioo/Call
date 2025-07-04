"use client"
import type { Metadata } from "next";
import SideBar from "@/components/app/sideBar";
import CallsSection from "@/components/app/sections/CallSection";
import TeamsSection from "@/components/app/sections/TeamsSection";
import FriendsSection from "@/components/app/sections/FriendsSection";
import ScheduleSection from "@/components/app/sections/ScheduleSection";
import { useState } from "react";


const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  calls: CallsSection,
  teams: TeamsSection,
  friends: FriendsSection,
  schedule: ScheduleSection,
};

const DEFAULT_SECTION = "calls";

const Page = () => {
  const [section, setSection] = useState<string>(DEFAULT_SECTION);

  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
  };

  const SectionComponent: React.ComponentType = SECTION_COMPONENTS[section] || CallsSection;

  return (
    <div className="w-full min-h-screen bg-[#111111] flex">
      {/* Sidebar */}
      <aside className="w-1/5 bg-[#111111]">
        <SideBar section={section} onSectionChange={handleSectionChange} />
      </aside>
      {/* Dashboard */}
      <main className="w-1/1 py-3">
        <SectionComponent />
      </main>
    </div>
  );
};

export default Page;
