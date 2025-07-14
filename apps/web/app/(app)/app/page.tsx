// This file defines the main page layout for the app section, including the sidebar, header, breadcrumbs, and main content area.
"use client";
import { AppSidebar } from "@/components/app/section/_components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@call/ui/components/breadcrumb";
import { Separator } from "@call/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@call/ui/components/sidebar";

export default function Page() {
  return (
    // SidebarProvider manages sidebar state for the layout
    <SidebarProvider>
      {/* Main sidebar for navigation and user info */}
      <AppSidebar />
      {/* SidebarInset wraps the main content area, including header and page content */}
      <SidebarInset>
        {/* Header with sidebar trigger, separator, and breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            {/* Button to toggle sidebar visibility */}
            <SidebarTrigger className="-ml-1" />
            {/* Vertical separator between sidebar trigger and breadcrumbs */}
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {/* Breadcrumb navigation for current page context */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {/* Main content area with two sections: a grid and a flexible content box */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Grid of three placeholder cards (could be used for widgets, stats, etc.) */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          {/* Main flexible content area, min height for mobile, rounded for desktop */}
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
