import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "glow";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 var(--ease-out) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            default:
              "bg-critical-600 text-white shadow hover:bg-critical-700 active:scale-[0.97] hover-lift:translate-y--1 hover:shadow-lg",
            destructive:
              "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.97]",
            outline:
              "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-[0.97] hover-lift:translate-y--1",
            ghost:
              "hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97]",
            link: "text-critical-600 underline-offset-4 hover:underline active:scale-[0.97]",
            glow:
              "bg-critical-600 text-white shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:bg-critical-700 active:scale-[0.97] hover-lift:translate-y--1",
          },
          {
            sm: "h-9 px-3",
            default: "h-11 px-5 py-2.5",
            lg: "h-12 px-8 py-3",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
