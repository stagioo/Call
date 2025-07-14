"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@call/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";
import { Button } from "@call/ui/components/button";
import { MoreHorizontal, LogOut } from "@geist-ui/icons";
import { useSession } from "@/hooks/useSession";
import { authClient } from "@call/auth/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icons } from "@call/ui/components/icons";
import type { SideBarProps } from "@/lib/types";
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@call/ui/components/sidebar";

function Pfp({ user }: { user: { name: string; image?: string | null } }) {
  // Generate initials from user name
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className="h-9 w-9 rounded-[10px]">
      <AvatarImage src={user.image || undefined} />
      <AvatarFallback className="h-9 w-9 rounded-[10px]">
        <span className="text-sm font-bold text-white">{initials}</span>
      </AvatarFallback>
    </Avatar>
  );
}

export default function SideBar({ section, onSectionChange }: SideBarProps) {
  const { session, isLoading, error } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { state, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Sidebar>
        <SidebarHeader className="w-full px-3 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-md bg-gray-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-2 w-4 animate-pulse rounded bg-gray-100" />
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  if (error || !session) {
    return (
      <Sidebar>
        <SidebarHeader className="w-full px-3 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-[25px] w-[25px] rounded-md bg-gray-200" />
              <p className="text-sm text-gray-500">Error loading user</p>
            </div>
            <Button className="h-8 w-8 text-neutral-500" variant={"ghost"}>
              <MoreHorizontal />
            </Button>
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="bg-[#131313]" collapsible="icon">
      <SidebarHeader className={`mb-6 flex items-center justify-between ${state === "expanded" ? "px-6 pt-6" : "px-2 pt-6 justify-center"}`}>
        {/* Left: Pfp, name, and dropdown menu */}
        <div className="flex items-center gap-2">
          <Pfp user={session.user} />
          {state === "expanded" && (
            <>
              <p className="text-sm font-medium text-white">{session.user.name}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8 w-8 text-[#d8d8d8]" variant={"ghost"}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-54 border border-[#2D2D2D] bg-[#171717]"
                  align="end"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 rounded-md">
                          <AvatarImage src={session.user.image || undefined} />
                          <AvatarFallback>
                            {session.user.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {session.user.name}
                          </p>
                          <p className="text-muted-foreground text-xs leading-none">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      variant="default"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Icons.sidebarClose
                className="h-[20px] w-[20px] cursor-pointer text-neutral-500"
                onClick={toggleSidebar}
              />
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Sidebar open icon when collapsed - positioned below pfp */}
      {state === "collapsed" && (
        <div className="flex justify-center mb-6">
          <Icons.sidebarClose
            className="h-[20px] w-[20px] cursor-pointer text-neutral-500"
            onClick={toggleSidebar}
          />
        </div>
      )}

      <SidebarContent className={state === "expanded" ? "px-6" : "px-2"}>
        {/* New Call Button */}
        {state === "expanded" && (
          <div className="mb-6">
            <button className="flex inline-flex h-10 w-full cursor-pointer items-center justify-start gap-2 rounded-[14px] bg-[#1D1D1D] px-5 py-2 text-[#757575] shadow-[inset_0px_0px_1px_0px_rgba(45,45,45,1.00)] transition-all duration-200 hover:rounded-lg hover:bg-[#2D2D2D] hover:text-white">
              <span className="flex h-[16px] w-[16px] items-center justify-center">
                <Icons.plus className="h-[16px] w-[16px] rounded" />
              </span>
              <span className="text-md font-['Geist'] font-medium text-neutral-500">
                New Call
              </span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={section === "calls"}
              onClick={() => onSectionChange("calls")}
              tooltip="Call"
            >
              <Icons.phoneIcon className="h-[18px] w-[18px]" />
              <span>Call</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={section === "schedule"}
              onClick={() => onSectionChange("schedule")}
              tooltip="Schedule"
            >
              <Icons.scheduleIcon className="h-[18px] w-[18px]" />
              <span>Schedule</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={section === "teams"}
              onClick={() => onSectionChange("teams")}
              tooltip="Teams"
            >
              <Icons.peopleIcon className="h-[18px] w-[18px]" />
              <span>Teams</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={section === "contacts"}
              onClick={() => onSectionChange("contacts")}
              tooltip="Contacts"
            >
              <Icons.friends className="h-[18px] w-[18px]" />
              <span>Contacts</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Support Section */}
      <SidebarFooter className={state === "expanded" ? "px-6 pb-4" : "px-2 pb-4"}>
        <div className={`flex items-center gap-x-2 ${state === "collapsed" ? "justify-center" : ""}`}>
          {state === "expanded" && (
            <SidebarMenuButton
              onClick={() => window.open("https://discord.com/invite/bre4echNxB")}
              tooltip="Join our discord"
            >
              <Icons.discord />
              <span>Join our discord</span>
            </SidebarMenuButton>
          )}
          <div className="flex h-[20px] w-[20px] items-center justify-center">
            <Icons.settings className="h-[20px] w-[20px] text-neutral-500 active:animate-[spin-once_0.7s_ease-out_1]" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
