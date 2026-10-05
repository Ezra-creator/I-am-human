import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <div className="py-6 md:py-10">
      <h1 className="text-[22px] font-bold text-ink mb-3 font-ui tracking-tight">
        History
      </h1>
      <p className="text-[15px] text-muted font-ui leading-relaxed max-w-xl">
        Your rewrites will be listed here. They are saved in this browser only.
      </p>
    </div>
  );
}
