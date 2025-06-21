import React from "react";
import { WaitlistForm } from "./waitlist";
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
    <div className="max-w-5xl w-full mx-auto px-6 flex items-center justify-center flex-col relative gap-10">
      <div className="h-px w-full bg-border dark:bg-white/5 max-w-lg mx-auto flex items-center justify-center gap-2 relative">
        <SquareDot />
        <SquareDot position="bottomRight" />
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <h2 className="text-3xl font-bold font-lora max-w-lg text-center text-primary/80">
          Join the community
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg text-center">
          Connect with other users and get support.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex w-full flex-col items-center gap-4 rounded-2xl bg-background px-4 py-3 shadow-lg  md:p-7 md:text-center xl:gap-6 xl:rounded-3xl xl:p-8 border border-border dark:border-white/5"
          >
            <link.icon className="md:size-14 size-8 text-primary/50" />
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-medium text-primary/80">
                {link.label}
              </p>
              <p className="text-sm text-muted-foreground">
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
