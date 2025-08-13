"use client";

import * as React from "react";
import type { SVGProps } from "react";
import { siteConfig } from "@/lib/site";
import { Button } from "@call/ui/components/button";
import Link from "next/link";
import { Badge } from "@call/ui/components/badge";

const Vercel = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 222" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" {...props}>
    <path fill="currentColor" d="m128 0 128 221.705H0z" />
  </svg>
);

const HeroWithForm = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-30">
      <Badge asChild className="gap-1 cursor-pointer">
        <a
          href="https://vercel.com/oss"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Backed by Vercel - Open Source Sponsorship"
        >
          Backed by <Vercel className="h-3 w-3" /> Vercel
        </a>
      </Badge>
      <h1 className="font-lora text-primary/80 max-w-lg text-center text-4xl font-bold">
        {siteConfig.description}
      </h1>
      <p className="text-center text-muted-foreground max-w-lg">
        We are in early development phase, but you can already access the platform and try its features.
      </p>
      <Button asChild size="lg" className="mt-4">
        <Link href="/app">
          Access Platform
        </Link>
      </Button>
    </div>
  );
};

export default HeroWithForm;
