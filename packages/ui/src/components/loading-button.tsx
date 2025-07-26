"use client";

import type React from "react";

import { Button } from "@call/ui/components/button";
import { cn } from "@call/ui/lib/utils";
import { Loader } from "lucide-react";
import { forwardRef } from "react";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, children, className, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(className)}
        {...props}
      >
        <div className="grid grid-cols-1 grid-rows-1 place-items-center">
          <Loader
            className={cn(
              "h-4 w-4 animate-spin transition-opacity duration-200",
              loading ? "opacity-100" : "opacity-0"
            )}
            style={{ gridArea: "1 / 1" }}
          />

          <span
            className={cn(
              "flex items-center gap-2 transition-opacity duration-200",
              loading ? "opacity-0" : "opacity-100"
            )}
            style={{ gridArea: "1 / 1" }}
          >
            {children}
          </span>
        </div>
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
