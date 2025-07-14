"use client";
import { AppSidebar } from "@/components/app/section/_components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@call/ui/components/sidebar";
import { Separator } from "@call/ui/components/separator";
import { Button } from "@call/ui/components/button";
import { usePathname, useRouter } from "next/navigation";

const sectionMap = [
  { path: "/app/call", title: "Call" },
  { path: "/app/teams", title: "Teams" },
  { path: "/app/contact", title: "Contact" },
  { path: "/app/schedule", title: "Schedule" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Find the section that matches the current path
  const selectedSection = sectionMap.find((s) => pathname?.startsWith(s.path))?.title || "Call";

  const handleSectionSelect = (title: string) => {
    const section = sectionMap.find((s) => s.title === title);
    if (section) {
      router.push(section.path);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar selectedSection={selectedSection} onSectionSelect={handleSectionSelect} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              {/* Section title can be rendered by each page */}
            </div>
            <div>
              <Button>Start Call</Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 border p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 