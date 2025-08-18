"use client";

import Header from "@/components/app/header";
import TeamSection from "@/components/app/section/team-section";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@call/ui/components/button";
import { CloseSidebarButton } from "@/components/app/section/_components/close-sidebar-button";

export default function TeamsPage() {
  const { onOpen } = useModal();
  return (
    <div className="flex flex-col">
      <Header className="justify-between">
        <div>
          <CloseSidebarButton className="-ml-8" />
        </div>
        <Button
          onClick={() => onOpen("create-team")}
          className="bg-primary-blue hover:bg-primary-blue/80 font-medium text-white px-4 py-2 rounded-md text-sm"
        >
          Create Team
        </Button>
      </Header>
      <TeamSection />
    </div>
  );
}
