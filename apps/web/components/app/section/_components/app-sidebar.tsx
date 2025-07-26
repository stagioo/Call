"use client";
import { useSession } from "@/components/providers/session";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@call/ui/components/sidebar";
import { Bell, Calendar, Contact, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

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
    {
      title: "Notifications",
      url: "#",
      icon: Bell,
    },
  ],
};

export function AppSidebar({
  selectedSection,
  onSectionSelect,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  selectedSection: string;
  onSectionSelect: (title: string) => void;
}) {
  const session = useSession();
  const router = useRouter();

  const navItems = data.navMain.map((item) => ({
    ...item,
    isActive: item.title === selectedSection,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser
          user={{
            name: session.user.name,
            email: session.user.email,
            avatar: session.user.image || "/avatars/default.jpg",
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} onSelect={onSectionSelect} />
      </SidebarContent>
      <SidebarFooter>sidebar footer</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
