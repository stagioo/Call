"use client";

import { siteConfig } from "@/lib/site";
import { WaitlistForm } from "./waitlist";

const HeroWithForm = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-30">
      <h1 className="font-lora text-primary/80 max-w-lg text-center text-4xl font-bold">
        {siteConfig.description}
      </h1>
      <WaitlistForm />
    </div>
  );
};
export default HeroWithForm;
