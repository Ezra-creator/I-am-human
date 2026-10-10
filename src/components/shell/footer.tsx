import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-line py-5 px-4 text-center font-ui text-[12px] text-muted">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="select-none">
          I’m human — Natural rhythm and personal voice for AI drafts.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            Privacy
          </Link>
          <span className="text-line" aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            Terms
          </Link>
          <span className="text-line" aria-hidden="true">·</span>
          <a
            href="https://groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            Powered by Groq
          </a>
        </div>
      </div>
    </footer>
  );
}
