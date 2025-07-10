"use client";

import { SquareDot } from "@call/ui/components/square-dot";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const Footer = () => {
  const [currentYear, setCurrentYear] = useState<string>("");

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <div className="relative mx-auto mt-auto flex w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-10">
      <div className="bg-border relative mx-auto flex h-px w-full max-w-lg items-center justify-center gap-2 dark:bg-white/5">
        <SquareDot />
        <SquareDot position="bottomRight" />
      </div>
      <div className="flex items-center justify-center gap-2">
        <Link href="/privacy">Privacy Policy</Link>
        <p className="text-muted-foreground text-sm">
          &copy; {currentYear} Call. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
