"use client";

import { useSidebar } from "@call/ui/components/sidebar";
import { Button } from "@call/ui/components/button";
import { PanelRight } from "lucide-react";

export function CloseSidebarButton({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={className}
    >
      <PanelRight className="h-4 w-4" />
    </Button>
  );
}
