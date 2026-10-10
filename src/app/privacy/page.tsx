import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How your writing and data are handled by I’m human.",
};

export default function PrivacyPage() {
  return (
    <div className="py-8 md:py-12 max-w-2xl mx-auto font-ui text-[14.5px] leading-relaxed text-ink space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink mb-1">
          Privacy Policy
        </h1>
        <p className="text-[13px] text-muted">Last updated: October 2026</p>
      </div>

      <section className="space-y-3 pt-2">
        <h2 className="text-[16px] font-semibold text-ink">Browser-first storage</h2>
        <p className="text-muted">
          I’m human does not require user accounts, passwords, or a centralized database. Your drafts, custom voice profiles, and rewrite history are stored entirely inside your local browser via IndexedDB and LocalStorage. Clearing your browsing data removes this information permanently.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-ink">Third-party model processing</h2>
        <p className="text-muted">
          When you submit text for rewriting, your original text and a concise style descriptor (never your raw sample texts) are securely transmitted to Groq via server-side API proxy to generate the rewrite.
        </p>
        <p className="text-muted">
          We do not log, retain, store, or inspect your text on any application server. Groq’s data retention and processing policies govern their handling of incoming inference requests according to their terms.
        </p>
      </section>

      <div className="pt-6 border-t border-line">
        <Link
          href="/"
          className="text-accent hover:underline text-[13.5px] font-medium inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Return to Workspace</span>
        </Link>
      </div>
    </div>
  );
}
