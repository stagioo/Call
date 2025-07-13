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
import type { NavItemProps, SideBarProps } from "@/lib/types";
import React from "react";
import { SidebarMenu } from "@call/ui/components/sidebar";

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

function NavItem({
  icon,
  label,
  onClick,
  isActive = false,
  isCollapsed = false,
}: NavItemProps & { isCollapsed?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center ${isCollapsed ? "justify-center" : "justify-start"} gap-2.5 gap-3 rounded-2xl px-5 py-2.5 transition-colors ${
        isActive
          ? "bg-neutral-800 text-white"
          : "text-neutral-500 hover:bg-neutral-800 hover:text-white"
      }`}
    >
      <div
        className={`top-[1.25px] flex h-6 w-6 items-center justify-center font-['Geist'] text-base font-medium ${
          isActive ? "text-white" : "text-neutral-500 group-hover:text-white"
        }`}
      >
        {icon}
      </div>
      {!isCollapsed && (
        <span
          className={`font-['Geist'] text-base font-medium ${
            isActive ? "text-white" : "text-neutral-500 group-hover:text-white"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export default function SideBar({ section, onSectionChange }: SideBarProps) {
  const { session, isLoading, error } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      <div className="min-h-screen w-full">
        <div className="w-full px-3 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-md bg-gray-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-2 w-4 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full px-3 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-[25px] w-[25px] rounded-md bg-gray-200" />
              <p className="text-sm text-gray-500">Error loading user</p>
            </div>
            <Button className="h-8 w-8 text-neutral-500" variant={"ghost"}>
              <MoreHorizontal />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#131313] transition-all duration-300 ${
        isCollapsed ? "w-[64px] px-2 pb-4 pt-4" : "w-[320px] px-6 pb-4 pt-6"
      }`}
    >
      {/* Profile Section */}
      <div
        className={`mb-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {/* Left: Pfp and name */}
        <div className="flex items-center gap-2">
          <Pfp user={session.user} />
          {!isCollapsed && (
            <p className="text-sm font-medium">{session.user.name}</p>
          )}
        </div>
        {/* Right: DropdownMenu and sidebar close icon */}
        {!isCollapsed && (
          <div className="flex items-center gap-3">
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
              onClick={() => setIsCollapsed((v: boolean) => !v)}
            />
          </div>
        )}
        {/* If collapsed, show only the close icon */}
        {isCollapsed && (
          <Icons.sidebarClose
            className="h-[20px] w-[20px] cursor-pointer text-neutral-500"
            onClick={() => setIsCollapsed((v: boolean) => !v)}
          />
        )}
      </div>
      {/* New Call Button */}
      {!isCollapsed && (
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
      <nav className="flex flex-col gap-2">
        <NavItem
          isActive={section === "calls"}
          onClick={() => onSectionChange("calls")}
          icon={<Icons.phoneIcon className="h-[18px] w-[18px]" />}
          label="Call"
          isCollapsed={isCollapsed}
        />
        <NavItem
          isActive={section === "schedule"}
          onClick={() => onSectionChange("schedule")}
          icon={<Icons.scheduleIcon className="h-[18px] w-[18px]" />}
          label="Schedule"
          isCollapsed={isCollapsed}
        />
        <NavItem
          isActive={section === "teams"}
          onClick={() => onSectionChange("teams")}
          icon={<Icons.peopleIcon className="h-[18px] w-[18px]" />}
          label="Teams"
          isCollapsed={isCollapsed}
        />
        <NavItem
          isActive={section === "contacts"}
          onClick={() => onSectionChange("contacts")}
          icon={<Icons.contactsIcon className="h-[18px] w-[18px]" />}
          label="Contacts"
          isCollapsed={isCollapsed}
        />
      </nav>
      {/* Support Section */}
      <div className="mt-auto flex items-center gap-x-2">
        <NavItem
          icon={
            <span className="flex h-[18px] w-[18px] items-center justify-center">
              <Icons.discord className="h-[18px] w-[18px]" />
            </span>
          }
          label="Join our discord"
          onClick={() => window.open("https://discord.com/invite/bre4echNxB")}
          isCollapsed={isCollapsed}
        />
        <div className="flex h-[20px] w-[20px] items-center justify-center">
          <Icons.settings className="h-[20px] w-[20px] text-neutral-500 active:animate-[spin-once_0.7s_ease-out_1]" />
        </div>
      </div>
    </div>
  );
}
