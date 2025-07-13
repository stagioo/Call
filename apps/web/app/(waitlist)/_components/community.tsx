import React from "react";
import { Icons } from "@call/ui/components/icons";
import { siteConfig } from "@/lib/site";
import Link from "next/link";
import { SquareDot } from "@call/ui/components/square-dot";

const links = [
  {
    label: "Twitter",
    href: siteConfig.links.x,
    icon: Icons.x,
    description: "Stay updated with the latest news and updates",
  },
  {
    label: "Discord",
    href: siteConfig.links.discord,
    icon: Icons.discord,
    description: "Report bugs, request features, and discuss the project",
  },
  {
    label: "GitHub",
    href: siteConfig.links.github,
    icon: Icons.github,
    description: "Contribute to the project and get involved",
  },
];

const Community = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-10 px-6">
      <div className="bg-border relative mx-auto flex h-px w-full max-w-lg items-center justify-center gap-2 dark:bg-white/5">
        <SquareDot />
        <SquareDot position="bottomRight" />
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <h2 className="font-lora text-primary/80 max-w-lg text-center text-3xl font-bold">
          Join the community
        </h2>
        <p className="text-muted-foreground max-w-lg text-center text-sm">
          Connect with other users and get support.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="bg-background shadow-xs border-border hover:border-ring flex w-full flex-col items-center gap-4 rounded-2xl border px-4 py-3 transition-all duration-300 hover:contrast-125 md:p-7 md:text-center xl:gap-6 xl:rounded-3xl xl:p-8 dark:border-white/5 dark:hover:border-white/10 dark:hover:brightness-125"
          >
            <link.icon className="text-primary/50 size-8 md:size-14" />
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-primary/80 text-sm font-medium">
                {link.label}
              </p>
              <p className="text-muted-foreground text-sm">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Community;
