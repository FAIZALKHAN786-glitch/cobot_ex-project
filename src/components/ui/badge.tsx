import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          {
            default: "border-transparent bg-slate-900 text-white hover:bg-slate-800",
            secondary:
              "border-transparent bg-slate-200 text-slate-900 hover:bg-slate-300",
            destructive:
              "border-transparent bg-destructive text-destructive-foreground",
            outline: "text-slate-900 border-slate-200",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
