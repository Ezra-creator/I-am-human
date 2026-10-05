import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import { Header, BottomNav, SkipLink } from "@/components/shell";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s — I’m human",
    default: "I’m human",
  },
  description: "Rewrite AI-drafted text so it sounds like you wrote it.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "rgb(243, 245, 247)" },
    { media: "(prefers-color-scheme: dark)", color: "rgb(15, 19, 23)" },
  ],
};

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('imhuman-theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${sourceSerif4.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-ui text-[15px] bg-bg text-ink antialiased">
        <ToastProvider swipeDirection="right">
          <TooltipProvider delayDuration={200}>
            <SkipLink />
            <Header />
            <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6 pt-2 pb-[calc(76px+env(safe-area-inset-bottom,0px))] min-[681px]:pb-10 flex-1 flex flex-col">
              <main id="main-content" tabIndex={-1} className="w-full flex-1 flex flex-col outline-none">
                {children}
              </main>
            </div>
            <BottomNav />
            <ToastViewport />
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
