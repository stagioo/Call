"use client";

import { Button } from "@call/ui/components/button";
import { SquareDot } from "@call/ui/components/square-dot";
import { Icons } from "@call/ui/components/icons";
import { siteConfig } from "@/lib/site";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Users } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  {
    label: "Github",
    href: siteConfig.links.github,
    icon: Icons.github,
  },
  {
    label: "Discord",
    href: siteConfig.links.discord,
    icon: Icons.discord,
  },
  {
    label: "X",
    href: siteConfig.links.x,
    icon: Icons.x,
  },
];

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <header className="border-border border-b dark:border-white/5">
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Icons.logoDark className="block size-6 dark:hidden" />
          <Icons.logo className="hidden size-6 dark:block" />
          <span className="text-primary font-lora">Call</span>
        </h1>
        <div className="flex items-center gap-2">


        <Button className="bg-primary dark:hover:bg-muted-foreground/10 text-white dark:bg-[#202020]">
            <Link href="/r">Demo</Link>
          </Button>
          
          <Link
            href="/contributors"
            className="flex items-center gap-1 px-3 py-2 rounded-md text-primary hover:bg-muted-foreground/10 transition-colors"
          >
            <Users className="size-4" />
         
          </Link>
        
          {links.map((link) => (
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-muted-foreground/10"
              key={link.label}
              asChild
            >
              <Link href={link.href} target="_blank">
                <link.icon className="size-4" />
              </Link>
            </Button>
          ))}
          {mounted ? (
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-muted-foreground/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          ) : (
            <div className="pointer-events-none size-9" />
          )}
        </div>
        <SquareDot position="bottomLeft" />
        <SquareDot position="bottomRight" />
      </div>
    </header>
  );
};

export default Navbar;
