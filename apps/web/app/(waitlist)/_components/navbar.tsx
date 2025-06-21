import { Button } from "@call/ui/components/button";
import { SquareDot } from "@call/ui/components/square-dot";
import { Icons } from "@call/ui/components/icons";
import { siteConfig } from "@/lib/site";
import Link from "next/link";

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
  return (
    <header className="border-b border-border">
      <div className="max-w-5xl w-full mx-auto px-6 py-2 flex items-center justify-between relative">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icons.logoDark className="size-6 " />
          <span className="text-primary">Call</span>
        </h1>
        <div className="flex items-center gap-2">
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
        </div>
        <SquareDot position="bottomLeft" />
        <SquareDot position="bottomRight" />
      </div>
    </header>
  );
};

export default Navbar;
