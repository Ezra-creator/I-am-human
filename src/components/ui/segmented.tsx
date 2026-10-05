import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
  tooltip?: React.ReactNode;
}

export interface SegmentedProps<T extends string = string> {
  id?: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Segmented<T extends string = string>({
  id,
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
  size = "md",
  disabled = false,
}: SegmentedProps<T>) {
  const sizeStyles = {
    sm: "px-2.5 py-1 text-[12px]",
    md: "px-3.5 py-[7px] text-[13px] md:text-[14px]",
  };

  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex border border-line rounded-[6px] overflow-hidden bg-panel",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isDisabled = disabled || option.disabled;

        const buttonElement = (
          <button
            key={option.value}
            type="button"
            role="button"
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
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

        if (option.tooltip) {
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                {buttonElement}
              </TooltipTrigger>
              <TooltipContent>{option.tooltip}</TooltipContent>
            </Tooltip>
          );
        }

        return buttonElement;
      })}
    </div>
  );
}
