import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "quiet";
  size?: "sm" | "md";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-ui font-semibold rounded-[6px] select-none cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variantStyles = {
      primary:
        "bg-accent text-accent-ink border-0 hover:brightness-[1.08] active:brightness-95",
      ghost:
        "bg-transparent border border-line text-ink hover:bg-bg active:bg-panel",
      quiet:
        "bg-transparent border-0 text-muted hover:text-ink hover:bg-bg/60 active:bg-bg",
    };

    const sizeStyles = {
      sm: "text-[13px] px-3 py-1.5 min-h-[30px] gap-1.5",
      md: "text-[15px] px-[18px] py-[9px] min-h-[38px] gap-2",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? "true" : undefined}
        {...props}
      >
        {isLoading && (
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
