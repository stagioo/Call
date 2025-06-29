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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu"

import { Button } from "@call/ui/components/button";
import { MoreHorizontal } from "@geist-ui/icons";
import { useSession } from "@/hooks/useSession";

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
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export default function SideBar() {
  const { session, isLoading, error } = useSession();

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
      <div className="w-full min-h-screen">
        {/* container */}
        <div className="w-full py-5 px-3">
          {/* user settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pfp user={session.user} />
              <p className="text-sm">{session.user.name}</p>
            </div>
            <div>
              <Button className="w-8 h-8 text-[#d8d8d8]" variant={"ghost"}>
                <MoreHorizontal />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
