"use client";

import Header from "@/components/app/header";
import TeamSection from "@/components/app/section/team-section";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@call/ui/components/button";
import { CloseSidebarButton } from "@/components/app/section/_components/close-sidebar-button";

export default function TeamsPage() {
  const { onOpen } = useModal();
  return (
    <div className="flex flex-col gap-[22px]">
      <Header className="justify-between">
        <div>
          <CloseSidebarButton className="-ml-8" />
        </div>
        <Button
          onClick={() => onOpen("create-team")}
          className="bg-inset-accent-foreground hover:bg-inset-accent-foreground/80 text-white"
        >
          Create Team
        </Button>
      </Header>
      <TeamSection />
    </div>
  );
}
