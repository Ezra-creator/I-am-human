import { cn } from "@/lib/utils";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50",
        "bg-panel text-ink border border-line rounded-[6px] px-3.5 py-2 font-ui text-[13px] font-semibold",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        "shadow-[0_4px_16px_-2px_rgba(0,0,0,0.08)]"
      )}
    >
      Skip to content
    </a>
  );
}
