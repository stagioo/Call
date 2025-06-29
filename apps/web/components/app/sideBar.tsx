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
      <AvatarFallback className="rounded-sm w-[25px] h-[25px]" >{initials}</AvatarFallback>
    </Avatar>
  );
}

export default function SideBar() {
  const { session, isLoading, error } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call the logout endpoint
      await authClient.signOut();
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to login page
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-8 h-8 text-[#d8d8d8]" variant={"ghost"}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
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
                      <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
