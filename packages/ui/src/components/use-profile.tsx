import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@call/ui/components/avatar";

import { cn } from "@call/ui/lib/utils.ts";

const iconvVariants = cva(
  "rounded-full border flex items-center justify-center",
  {
    variants: {
      size: {
        default: "size-10 min-w-10 rounded-md",
        sm: "size-8 min-w-8 rounded-md",
        lg: "size-10 min-w-10 rounded-md",
        xs: "size-6 min-w-6 rounded-md",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface ProfileProps extends VariantProps<typeof iconvVariants> {
  className?: string;
  url?: string | null;
  name: string;
}

export const UserProfile = ({ className, url, name, size }: ProfileProps) => {
  const twoLettersName = name
    .split("-")
    .map((l) => l[0])
    .join("");

  return (
    <Avatar className={cn(iconvVariants({ size, className }))}>
      <AvatarImage src={url as string} />
      <AvatarFallback className="rounded-md text-sm font-semibold">
        {twoLettersName}
      </AvatarFallback>
    </Avatar>
  );
};
