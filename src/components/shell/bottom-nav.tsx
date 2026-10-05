"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, AudioLines, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Workspace", icon: PenLine },
  { href: "/voices", label: "Voices", icon: AudioLines },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-line",
        "flex min-[681px]:hidden items-center justify-around",
        "pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-2"
      )}
    >
      <div className="w-full grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center py-1 rounded-[6px] gap-1 font-ui text-[11px] transition-colors duration-150 select-none",
                "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1",
                isActive
                  ? "text-accent font-semibold"
                  : "text-muted hover:text-ink font-medium"
              )}
            >
              <Icon size={18} strokeWidth={1.5} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
