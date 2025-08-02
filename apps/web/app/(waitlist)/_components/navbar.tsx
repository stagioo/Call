"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@call/ui/components/button";
import { SquareDot } from "@call/ui/components/square-dot";
import { Icons } from "@call/ui/components/icons";
import { siteConfig } from "@/lib/site";
import { Sun, Moon, Users, Loader2, Menu, X } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="border-border bg-background/50 sticky top-0 z-50 border-b backdrop-blur-sm dark:border-white/5">
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between border-x px-6 py-2 dark:border-white/5">
        {/* Left: Logo */}
        <Link href="/" className="z-50">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Icons.logoDark className="block size-6 dark:hidden" />
            <Icons.logo className="hidden size-6 dark:block" />
            <span className="text-primary font-lora">Call</span>
          </h1>
        </Link>

        <div className="z-50 flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <Button
                key={link.label}
                size="icon"
                variant="ghost"
                className="hover:bg-muted-foreground/10"
                asChild
              >
                <Link href={link.href} target={link.target ?? "_blank"}>
                  <link.icon className="size-4" />
                </Link>
              </Button>
            ))}
          </div>

          {/* Theme toggle */}
          {mounted ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="hover:bg-muted-foreground/10"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          ) : (
            <div className="pointer-events-none flex size-9 items-center justify-center">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {/* Mobile Menu toggle */}
          <div className="md:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="hover:bg-muted-foreground/10"
            >
              {menuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {menuOpen && (
          <div className="bg-background absolute left-0 right-0 top-full flex flex-col border-t p-4 md:hidden dark:border-white/5">
            {links.map((link) => (
              <Button
                key={link.label}
                variant="ghost"
                className="hover:bg-muted-foreground/10 w-full justify-start"
                asChild
              >
                <Link
                  href={link.href}
                  target={link.target ?? "_blank"}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="size-4" />
                    {link.label}
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        )}

        <SquareDot position="bottomLeft" />
        <SquareDot position="bottomRight" />
      </div>
    </header>
  );
};

export default Navbar;
