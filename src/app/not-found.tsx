import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-16 md:py-24 max-w-lg mx-auto text-center font-ui">
      <h1 className="text-[32px] font-bold text-ink tracking-tight mb-2">
        Page not found
      </h1>
      <p className="text-[15px] text-muted leading-relaxed mb-6">
        The link you followed doesn’t exist or has moved. Return to the workspace to rewrite text in your voice.
      </p>
      <Link href="/">
        <Button type="button" variant="primary" size="md" className="gap-2">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Go to workspace</span>
        </Button>
      </Link>
    </div>
  );
}
