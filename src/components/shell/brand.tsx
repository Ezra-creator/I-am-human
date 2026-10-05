import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandProps {
  className?: string;
}

export function Brand({ className }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-ui text-[18px] font-bold tracking-[-0.01em] text-ink select-none group focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-[6px]",
        className
      )}
      aria-label="I’m human home"
    >
      <span
        aria-hidden="true"
        className="w-[22px] h-[22px] rounded-[5px] bg-accent text-accent-ink flex items-center justify-center font-text font-semibold text-[17px] leading-none shrink-0"
      >
        ’
      </span>
      <span>I’m human</span>
    </Link>
  );
}
