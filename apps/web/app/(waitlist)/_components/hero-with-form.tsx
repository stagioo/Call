"use client";

import * as React from "react";
import type { SVGProps } from "react";
import { siteConfig } from "@/lib/site";
import { WaitlistForm } from "./waitlist";
import { Badge } from "@call/ui/components/badge";

const Vercel = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 222" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" {...props}>
    <path fill="currentColor" d="m128 0 128 221.705H0z" />
  </svg>
);

const HeroWithForm = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-30">
      <Badge className="gap-1">
        Backed by <Vercel className="h-3 w-3" /> Vercel
      </Badge>
      <h1 className="font-lora text-primary/80 max-w-lg text-center text-4xl font-bold">
        {siteConfig.description}
      </h1>
      <WaitlistForm />
    </div>
  );
};

export default HeroWithForm;
