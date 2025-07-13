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
import CallModal from "./sections/callModal";

function Pfp({ user }: { user: { name: string; image?: string | null } }) {
  // Generate initials from user name
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className="h-[25px] w-[25px] rounded-sm">
      <AvatarImage src={user.image || undefined} />
      <AvatarFallback className="h-[25px] w-[25px] rounded-sm">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function NavItem({ icon, label, onClick, isActive = false }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isActive
          ? "bg-[#202020] text-white"
          : "text-[#d8d8d8] hover:bg-[#202020] hover:text-white"
      }`}
    >
      <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
      <span className="text-sm">{label}</span>
    </button>
  );
}

export default function SideBar({ section, onSectionChange }: SideBarProps) {
  const { session, isLoading, error } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

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
              <div className="h-[25px] w-[25px] animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
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
            <Button className="h-8 w-8 text-[#d8d8d8]" variant={"ghost"}>
              <MoreHorizontal />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        {/* container */}
        <div className="flex w-full flex-1 flex-col px-3 py-5">
          {/* user settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pfp user={session.user} />
              <p className="text-sm">{session.user.name}</p>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8 w-8 text-[#d8d8d8]" variant={"ghost"}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 border border-[#222] bg-[#171717]"
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

          <div className="mt-10 flex h-full flex-1 flex-col">
            {/* CTA Button */}
            <div>

              <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#272727] py-2 text-[#d8d8d8]">
                <span className="text-sm text-[#fff]">Start Call</span>
              </button>
            </div>
            {/* App sections */}
            <div className="mt-10 flex flex-col gap-2">
              <NavItem
                icon={<IconPhone size={18} />}
                label="Calls"
                isActive={section === "calls"}
                onClick={() => onSectionChange("calls")}
              />
              {/* <NavItem
                icon={<IconCalendar size={18} />}
                label="Schedule"
                isActive={section === "schedule"}
                onClick={() => onSectionChange("schedule")}
              /> */}
              <NavItem
                icon={
                  <span className="flex h-[18px] w-[18px] items-center justify-center">
                    <Icons.teams className="h-[18px] w-[18px]" />
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
        <div className="mt-auto w-full px-3 pb-5">
          <NavItem
            icon={
              <span className="flex h-[18px] w-[18px] items-center justify-center">
                <Icons.discord className="h-[18px] w-[18px]" />
              </span>
            }
            label="Join our discord"
            onClick={() => window.open("https://discord.com/invite/bre4echNxB")}
          />
        </div>
      </div>
      <CallModal open={showCallModal} onClose={() => setShowCallModal(false)} />
    </>
  );
}
