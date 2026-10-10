import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and responsibilities for using I’m human.",
};

export default function TermsPage() {
  return (
    <div className="py-8 md:py-12 max-w-2xl mx-auto font-ui text-[14.5px] leading-relaxed text-ink space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink mb-1">
          Terms of Service
        </h1>
        <p className="text-[13px] text-muted">Last updated: October 2026</p>
      </div>

      <section className="space-y-3 pt-2">
        <h2 className="text-[16px] font-semibold text-ink">Service provided as-is</h2>
        <p className="text-muted">
          I’m human is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied. Rewriting is performed by third-party model providers (Groq) and may experience occasional upstream latency or service interruptions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-ink">No AI detector score guarantees</h2>
        <p className="text-muted">
          The service is designed to improve sentence rhythm, eliminate cliché stock vocabulary, and adapt style to personal voice metrics. Outputs are not guaranteed to evade or achieve specific scores on any automated AI detection systems. AI detectors are probabilistic, inconsistent, and often generate false positives.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-ink">User responsibility and academic integrity</h2>
        <p className="text-muted">
          You are solely responsible for your use of rewritten text and for adhering to the ethical, professional, and academic guidelines established by your school, employer, academic institution, or publishing house.
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
