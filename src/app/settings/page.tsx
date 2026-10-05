import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="py-6 md:py-10">
      <h1 className="text-[22px] font-bold text-ink mb-3 font-ui tracking-tight">
        Settings
      </h1>
      <p className="text-[15px] text-muted font-ui leading-relaxed max-w-xl">
        Preferences for appearance, your own Groq key and how your text is handled.
      </p>
    </div>
  );
}
