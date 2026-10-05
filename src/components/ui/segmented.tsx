import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string = string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
  size = "md",
}: SegmentedProps<T>) {
  const sizeStyles = {
    sm: "px-2.5 py-1 text-[12px]",
    md: "px-3.5 py-[7px] text-[13px] md:text-[14px]",
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex border border-line rounded-[6px] overflow-hidden bg-panel",
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="button"
            aria-pressed={isSelected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "bg-transparent border-0 cursor-pointer font-ui transition-colors duration-150 select-none",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] focus-visible:z-10",
              index > 0 && "border-l border-line",
              sizeStyles[size],
              isSelected
                ? "bg-accent-soft text-accent font-semibold"
                : "text-muted font-medium hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
