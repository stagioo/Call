"use client";
import { useSession } from "@/components/providers/session";
import { siteConfig } from "@/lib/site";
import { Icons } from "@call/ui/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@call/ui/components/sidebar";
import { useRouter } from "next/navigation";
import * as React from "react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { cn } from "@call/ui/lib/utils";

const data = {
  navMain: [
    {
      title: "Call",
      url: "#",
      icon: Icons.phoneIcon,
    },
    {
      title: "Schedule",
      url: "#",
      icon: Icons.scheduleIcon,
    },
    {
      title: "Teams",
      url: "#",
      icon: Icons.peopleIcon,
    },
    {
      title: "Contact",
      url: "#",
      icon: Icons.contactsIcon,
    },
    {
      title: "Notifications",
      url: "#",
      icon: Icons.notificationsIcon,
    },
  ],
  navFooter: [
    {
      title: "Settings",
      url: "/app/settings",
      icon: Icons.settings,
      type: "link",
    },
    {
      title: "Discord",
      url: siteConfig.links.discord,
      icon: Icons.sidebarDiscordIcon,
      type: "link",
    },
    {
      title: "Thoughts?",
      icon: Icons.thoughtsIcon,
      type: "button",
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
      <SidebarFooter className="p-4">
        <SidebarMenu>
          {data.navFooter.map((item) => (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span
                  className={cn(
                    item.title === "Thoughts?" && "font-medium text-[#FF6347]"
                  )}
                >
                  {item.title}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
