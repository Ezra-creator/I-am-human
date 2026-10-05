import * as React from "react";
import { cn } from "@/lib/utils";

export interface WorkspaceFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function WorkspaceFrame({ className, children, ...props }: WorkspaceFrameProps) {
  return (
    <div
      role="region"
      aria-label="Workspace"
      className={cn(
        "w-full bg-panel border border-line rounded-[10px] overflow-hidden min-h-[480px] md:min-h-[600px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
