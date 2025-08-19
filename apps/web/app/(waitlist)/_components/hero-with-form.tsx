"use client";

import * as React from "react";
import type { SVGProps } from "react";
import { siteConfig } from "@/lib/site";
import { Button } from "@call/ui/components/button";
import Link from "next/link";
import { Badge } from "@call/ui/components/badge";
import { Icons } from "@call/ui/components/icons";


const HeroWithForm = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-30">
      <Badge asChild  className="gap-1 bg-[#202020] cursor-pointer text-white  hover:bg-[#202020]/80">
        <a
          href="https://github.com/joincalldotco"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Source"
        >
         <Icons.github className="h-3 w-3" /> Open Source
        </a>
      </Badge>
      <h1 className="font-lora text-primary/80 max-w-lg text-center text-4xl font-bold">
        {siteConfig.description}
      </h1>
      <p className="text-center text-muted-foreground max-w-lg">
        We are in early development phase, but you can already access the platform and try its features.
      </p>
      <Button asChild size="sm" className="mt-4 bg-primary-blue hover:bg-primary-blue/80 text-white">
        <Link href="/app">
          Access Platform
        </Link>
      </Button>
    </div>
  );
};

export default HeroWithForm;
