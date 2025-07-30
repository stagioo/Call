// This file defines the team switcher section in the sidebar, allowing the user to switch between teams or add a new one.
"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import type { Team } from "@/lib/types";
import { CreateTeamModal } from "./create-team-modal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@call/ui/components/sidebar";

// TeamSwitcher receives an array of teams and manages the active team state.
export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { session, isLoading: sessionLoading } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTeams = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teams`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        const teamsList = data.teams || [];
        setTeams(teamsList);
        
        // Set first team as active if no active team
        if (teamsList.length > 0 && !activeTeam) {
          setActiveTeam(teamsList[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && session?.user && !sessionLoading) {
      fetchTeams();
    }
  }, [mounted, session?.user, sessionLoading]);

  const handleTeamCreated = () => {
    fetchTeams(); // Refresh teams list
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted || sessionLoading) {
    return null;
  }

  if (!session?.user || loading) {
    return null;
  }

  if (!activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setShowCreateModal(true)}
            className="justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      {/* SidebarMenu for team selection */}
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Dropdown menu trigger is the team button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Team logo and info */}
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <span className="text-sm font-medium">
                    {activeTeam.name.charAt(0).toUpperCase()}
                  </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                  <span className="truncate text-xs">{activeTeam.members.length} members</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {/* Dropdown menu content with team options */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* List all teams as selectable items */}
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                  key={`${team.id}-${index}`}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                    <span className="text-xs font-medium">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {team.members.length} members
                    </p>
                </div>
                {/* Keyboard shortcut for quick switching */}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* Option to add a new team */}
              <DropdownMenuItem 
                className="gap-2 p-2"
                onClick={() => setShowCreateModal(true)}
              >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <CreateTeamModal 
              onClose={() => setShowCreateModal(false)}
              onTeamCreated={handleTeamCreated}
            />
          </div>
        </div>
      )}
    </>
  );
}
