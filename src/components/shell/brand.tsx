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
        "inline-flex items-center gap-1.5 font-ui text-[18px] font-bold tracking-tight text-ink select-none group focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-[6px] py-1",
        className
      )}
      aria-label="I’m human home"
    >
      <span className="tracking-tight">
        I<span className="font-text italic text-accent font-semibold text-[20px] -mx-0.5 inline-block select-none">’</span>m human
      </span>
    </Link>
  );
}
