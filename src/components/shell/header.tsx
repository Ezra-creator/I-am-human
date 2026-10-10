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
      <div className="max-w-[1280px] mx-auto h-full px-3 md:px-6 flex items-center justify-between">
        <Brand />

        {/* Desktop / Tablet Navigation (> 680px) */}
        <div className="hidden min-[681px]:flex items-center">
          <nav aria-label="Primary" className="flex items-center gap-1 font-ui text-[14px]">
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
                    "px-3 py-1.5 rounded-[6px] transition-colors duration-150 select-none",
                    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                    isActive
                      ? "text-ink bg-panel shadow-[inset_0_0_0_1px_var(--line)] font-medium"
                      : "text-muted hover:text-ink font-medium"
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
