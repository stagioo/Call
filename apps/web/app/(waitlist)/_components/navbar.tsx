"use client";

import { Button } from "@call/ui/components/button";
import { SquareDot } from "@call/ui/components/square-dot";
import { Icons } from "@call/ui/components/icons";
import { siteConfig } from "@/lib/site";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  {
    label: "Contributors",
    href: "/contributors",
    icon: Users,
    target: "_self",
  },
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
    <header className="border-border border-b dark:border-white/5 sticky top-0 z-50 bg-background/50 backdrop-blur-sm">
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-2 border-x dark:border-white/5">
        <Link href="/">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Icons.logoDark className="block size-6 dark:hidden" />
            <Icons.logo className="hidden size-6 dark:block" />
            <span className="text-primary font-lora">Call</span>
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button className="bg-primary dark:hover:bg-muted-foreground/10 text-white dark:bg-[#202020]">
            <Link href="/r">Demo</Link>
          </Button>

          {links.map((link) => (
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-muted-foreground/10"
              key={link.label}
              asChild
            >
              <Link href={link.href} target={link.target ?? "_blank"}>
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
            <div className="pointer-events-none size-9 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}
        </div>
        <SquareDot position="bottomLeft" />
        <SquareDot position="bottomRight" />
      </div>
    </header>
  );
};

export default Navbar;
