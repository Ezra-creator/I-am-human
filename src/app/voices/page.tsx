import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voices",
};

export default function VoicesPage() {
  return (
    <div className="py-6 md:py-10">
      <h1 className="text-[22px] font-bold text-ink mb-3 font-ui tracking-tight">
        Voices
      </h1>
      <p className="text-[15px] text-muted font-ui leading-relaxed max-w-xl">
        Add something you’ve written and I’m human will learn how you build sentences.
      </p>
    </div>
  );
}
