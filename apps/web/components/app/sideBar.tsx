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
import { IconPhone, IconCalendar, IconUsers } from "@tabler/icons-react";
import { Icons } from "@call/ui/components/icons";
import type { NavItemProps, SideBarProps } from "@/lib/types";

function Pfp({ user }: { user: { name: string; image?: string | null } }) {
  // Generate initials from user name
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className="rounded-sm w-[25px] h-[25px]">
      <AvatarImage src={user.image || undefined} />
      <AvatarFallback className="rounded-sm w-[25px] h-[25px]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function NavItem({ icon, label, onClick, isActive = false }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-[#202020] text-white"
          : "text-[#d8d8d8] hover:bg-[#202020] hover:text-white"
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
      <span className="text-sm">{label}</span>
    </button>
  );
}

export default function SideBar({ section, onSectionChange }: SideBarProps) {
  const { session, isLoading, error } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <div className="w-full min-h-screen">
        <div className="w-full py-5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[25px] h-[25px] bg-gray-200 rounded-md animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="w-full min-h-screen">
        <div className="w-full py-5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[25px] h-[25px] bg-gray-200 rounded-md" />
              <p className="text-sm text-gray-500">Error loading user</p>
            </div>
            <Button className="w-8 h-8 text-[#d8d8d8]" variant={"ghost"}>
              <MoreHorizontal />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen  flex flex-col">
        {/* container */}
        <div className="w-full py-5 px-3  flex-1 flex flex-col">
          {/* user settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pfp user={session.user} />
              <p className="text-sm">{session.user.name}</p>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-8 h-8 text-[#d8d8d8]" variant={"ghost"}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-[#171717] border border-[#222]"
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
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {session.user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
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
                      <span>
                        {isLoggingOut ? "Signing out..." : "Sign out"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* App navigation */}

          <div className="flex flex-col flex-1  h-full mt-10">
            {/* CTA Button */}
            <div>
              <button className="w-full cursor-pointer py-2 rounded-lg flex gap-2 items-center justify-center   bg-[#272727]  text-[#d8d8d8]">
                <span className="text-sm text-[#fff]">Start Call</span>
              </button>
            </div>
            {/* App sections */}
            <div className="flex flex-col gap-2 mt-10">
              <NavItem
                icon={<IconPhone size={18} />}
                label="Calls"
                isActive={section === "calls"}
                onClick={() => onSectionChange("calls")}
              />
              <NavItem
                icon={<IconCalendar size={18} />}
                label="Schedule"
                isActive={section === "schedule"}
                onClick={() => onSectionChange("schedule")}
              />
              <NavItem
                icon={
                  <span className="w-[18px] h-[18px] flex items-center justify-center">
                    <Icons.teams className="w-[18px] h-[18px]" />
                  </span>
                }
                label="Teams"
                isActive={section === "teams"}
                onClick={() => onSectionChange("teams")}
              />
              <NavItem
                icon={<IconUsers size={18} />}
                label="Contacts"
                isActive={section === "contacts"}
                onClick={() => onSectionChange("contacts")}
              />
            </div>
          </div>
        </div>
        {/* Support Section - sticky bottom */}
        <div className="w-full px-3 pb-5 mt-auto">
          <NavItem
            icon={
              <span className="w-[18px] h-[18px] flex items-center justify-center">
                <Icons.discord className="w-[18px] h-[18px]" />
              </span>
            }
            label="Join our discord"
            onClick={() => window.open("https://discord.com/invite/bre4echNxB")}
          />
        </div>
      </div>
    </>
  );
}
