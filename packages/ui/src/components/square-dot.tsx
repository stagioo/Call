import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@call/ui/lib/utils";

const squareDotVariants = cva(
  "rounded-[1px] size-[10px] bg-background border border-border absolute",
  {
    variants: {
      position: {
        topLeft: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
        topRight: "top-0 right-0 -translate-x-1/2 -translate-y-1/2",
        bottomLeft: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
        bottomRight: "-bottom-[5px] -right-[5px]",
      },

      size: {
        default: "size-[10px]",
        sm: "size-1",
        lg: "size-3",
      },
    },
    defaultVariants: {
      size: "default",
      position: "topLeft",
    },
  }
);

interface SquareDotProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof squareDotVariants> {}

function SquareDot({ className, size, position, ...props }: SquareDotProps) {
  return (
    <div
      className={cn(squareDotVariants({ size, position, className }))}
      {...props}
    />
  );
}

export { SquareDot, squareDotVariants };
