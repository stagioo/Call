"use client";
import Link from "next/link";
import * as React from "react";
import { Phone, Calendar, Users, Contact } from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarFooter
} from "@call/ui/components/sidebar";

// Importar useSession y useRouter
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Call",
      url: "#",
      icon: Phone,
      isActive: true,
    },
    {
      title: "Schedule",
      url: "#",
      icon: Calendar,
    },
    {
      title: "Teams",
      url: "#",
      icon: Users,
    },
    {
      title: "Contact",
      url: "#",
      icon: Contact,
    },
  ],
};

export function AppSidebar({ selectedSection, onSectionSelect, ...props }: React.ComponentProps<typeof Sidebar> & { selectedSection: string, onSectionSelect: (title: string) => void }) {
  const { session, isLoading } = useSession();
  const router = useRouter();

 
  const navItems = data.navMain.map((item) => ({
    ...item,
    isActive: item.title === selectedSection,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {session?.user ? (
          <NavUser
            user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image || "/avatars/default.jpg",
            }}
          />
        ) : (
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 transition"
            onClick={() => router.push("/login")}
          >
            log in
          </button>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} onSelect={onSectionSelect} />
      </SidebarContent>
      <SidebarFooter>
        sidebar footer
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
