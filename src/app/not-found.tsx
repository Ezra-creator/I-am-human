import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-12 md:py-16 max-w-md">
      <h1 className="text-[22px] font-bold text-ink mb-3 font-ui tracking-tight">
        Page not found
      </h1>
      <p className="text-[15px] text-muted font-ui leading-relaxed mb-6">
        The page you are looking for doesn’t exist or has moved.
      </p>
      <Link href="/">
        <Button variant="ghost" size="md">
          Return to workspace
        </Button>
      </Link>
    </div>
  );
}
