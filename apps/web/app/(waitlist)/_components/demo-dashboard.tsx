"use client"

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { SquareDot } from "@call/ui/components/square-dot";
import { useTheme } from "next-themes";

const DemoDashboard = () => {
  const { theme } = useTheme();
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
            src={theme === "dark" ? "/dashboard-dark.png" : "/dashboard-light.png"}
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
};

export default DemoDashboard;