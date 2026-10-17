"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Workspace" },
  { href: "/voices", label: "Voices" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full h-16 border-b border-transparent">
      <div className="max-w-[1280px] min-[1920px]:max-w-[1440px] mx-auto h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        <Brand />

        {/* Desktop / Tablet Navigation (> 680px) */}
        <div className="hidden min-[681px]:flex items-center">
          <nav
            aria-label="Primary"
            className="flex items-center p-1 rounded-full bg-panel/90 border border-line backdrop-blur-xs shadow-xs font-ui text-[13px] sm:text-[13.5px]"
          >
            {NAV_ITEMS.map((item) => {
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
                    "px-3.5 py-1.5 rounded-full transition-all duration-150 select-none font-medium leading-none",
                    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1",
                    isActive
                      ? "text-ink bg-bg shadow-xs border border-line/70 font-semibold"
                      : "text-muted hover:text-ink hover:bg-bg/40 border border-transparent"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
