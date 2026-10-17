"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  const handleFocusCapture = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsFocused(true);
  };

  const handleBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsFocused(false);
    }
  };

  const isExpanded = isHovered || isFocused;

  // Check if any nav item is active
  const isAnyActive = NAV_ITEMS.some((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );

  return (
    <header className="w-full h-16 border-b border-transparent">
      <div className="max-w-[1280px] min-[1920px]:max-w-[1440px] mx-auto h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        <Brand />

        {/* Desktop / Tablet Navigation (> 680px) */}
        <div className="hidden min-[681px]:flex items-center">
          <nav
            aria-label="Primary"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocusCapture={handleFocusCapture}
            onBlurCapture={handleBlurCapture}
            className={cn(
              "flex items-center p-1 rounded-full bg-panel/90 border border-line backdrop-blur-xs shadow-xs font-ui text-[13px] sm:text-[13.5px]",
              "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            )}
          >
            {NAV_ITEMS.map((item) => {
              const isMatched =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const isActive = isMatched || (!isAnyActive && item.href === "/");

              if (isActive) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current="page"
                    onClick={() => {
                      setIsHovered(false);
                      setIsFocused(false);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full transition-all duration-200 select-none font-semibold leading-none whitespace-nowrap",
                      "text-ink bg-bg shadow-xs border border-line/70 flex items-center gap-1.5 shrink-0",
                      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      size={12}
                      aria-hidden="true"
                      className={cn(
                        "transition-all duration-200 text-muted shrink-0",
                        isExpanded ? "w-0 opacity-0 -mr-1" : "w-3 opacity-70"
                      )}
                    />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={isExpanded ? 0 : -1}
                  onClick={() => {
                    setIsHovered(false);
                    setIsFocused(false);
                  }}
                  className={cn(
                    "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none font-medium leading-none whitespace-nowrap overflow-hidden",
                    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1",
                    isExpanded
                      ? "max-w-[120px] opacity-100 px-3.5 py-1.5 rounded-full text-muted hover:text-ink hover:bg-bg/40 border border-transparent pointer-events-auto"
                      : "max-w-0 opacity-0 px-0 py-1.5 pointer-events-none border-0"
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
