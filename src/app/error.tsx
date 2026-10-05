"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly for telemetry
    console.error(error);
  }, [error]);

  return (
    <div className="py-12 md:py-16 max-w-md">
      <h1 className="text-[22px] font-bold text-ink mb-3 font-ui tracking-tight">
        Something went wrong
      </h1>
      <p className="text-[15px] text-muted font-ui leading-relaxed mb-6">
        An unexpected error occurred while loading this view.
      </p>
      <Button variant="ghost" size="md" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
