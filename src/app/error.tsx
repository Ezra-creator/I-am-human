"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const router = useRouter();

  React.useEffect(() => {
    console.error("Application error captured:", error);
  }, [error]);

  return (
    <div className="py-16 md:py-24 max-w-lg mx-auto text-center font-ui">
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-2">
        Something unexpected happened
      </h1>
      <p className="text-[15px] text-muted leading-relaxed mb-6">
        An error interrupted this screen. Your drafts and local data in this browser have been preserved.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => reset()}
          className="gap-2"
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Try again</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => {
            router.push("/");
          }}
          className="gap-2"
        >
          <Home size={15} aria-hidden="true" />
          <span>Reload workspace</span>
        </Button>
      </div>
    </div>
  );
}
