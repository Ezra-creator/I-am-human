import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "inverse";
}

export function Kbd({
  className,
  variant = "default",
  children,
  ...props
}: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center font-ui font-medium text-[11px] leading-tight px-1.5 py-0.5 rounded-[4px] select-none",
        variant === "default" && "border border-line text-muted bg-panel/60",
        variant === "inverse" && "border border-current/40 text-inherit opacity-85",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
