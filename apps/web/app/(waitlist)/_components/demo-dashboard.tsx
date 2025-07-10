"use client";

import dashboardDark from "@/public/dashboard-dark.png";
import dashboardLight from "@/public/dashboard-light.png";
import { SquareDot } from "@call/ui/components/square-dot";
import Image from "next/image";
import { useEffect, useState } from "react";

const DemoDashboard = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-5xl w-full mx-auto px-6 flex items-center justify-center flex-col relative gap-6">
        <div className="h-px w-full bg-border dark:bg-white/5 max-w-lg mx-auto flex items-center justify-center gap-2 relative">
          <SquareDot />
          <SquareDot position="bottomRight" />
        </div>
        <div className="relative w-full max-w-6xl">
          <div className="relative overflow-hidden dark:border-white/10">
            <Image
              src="/dashboard-light.png"
              alt="Dashboard preview"
              width={1400}
              height={900}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-6 flex items-center justify-center flex-col relative gap-6">
      <div className="h-px w-full bg-border dark:bg-white/5 max-w-lg mx-auto flex items-center justify-center gap-2 relative">
        <SquareDot />
        <SquareDot position="bottomRight" />
      </div>
      <div className="relative w-full max-w-6xl">
        <div className="relative overflow-hidden dark:border-white/10">
          <Image
            src={dashboardLight}
            alt="Dashboard preview"
            width={1400}
            height={900}
            className="w-full h-auto object-cover block dark:hidden"
            placeholder="blur"
            priority
          />
          <Image
            src={dashboardDark}
            alt="Dashboard preview"
            width={1400}
            height={900}
            className="w-full h-auto object-cover hidden dark:block"
            placeholder="blur"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default DemoDashboard;
