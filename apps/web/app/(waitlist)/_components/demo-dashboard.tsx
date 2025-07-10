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
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 px-6">
        <div className="bg-border relative mx-auto flex h-px w-full max-w-lg items-center justify-center gap-2 dark:bg-white/5">
          <SquareDot />
          <SquareDot position="bottomRight" />
        </div>
        <DashboardImage />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 px-6">
      <div className="bg-border relative mx-auto flex h-px w-full max-w-lg items-center justify-center gap-2 dark:bg-white/5">
        <SquareDot />
        <SquareDot position="bottomRight" />
      </div>
      <DashboardImage />
    </div>
  );
};

const DashboardImage = () => {
  return (
    <div className="relative w-full max-w-6xl">
      <div className="relative overflow-hidden dark:border-white/10">
        <Image
          src={dashboardLight}
          alt="Dashboard preview"
          width={1400}
          height={900}
          className="block h-auto w-full object-cover dark:hidden"
          placeholder="blur"
          priority
        />
        <Image
          src={dashboardDark}
          alt="Dashboard preview"
          width={1400}
          height={900}
          className="hidden h-auto w-full object-cover dark:block"
          placeholder="blur"
          priority
        />
      </div>
    </div>
  );
};

export default DemoDashboard;
