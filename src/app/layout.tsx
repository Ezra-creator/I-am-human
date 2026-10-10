import type { Metadata, Viewport } from "next";
import { Header, BottomNav, SkipLink, Footer } from "@/components/shell";
import { ToastProvider, ToastViewport, Toaster } from "@/components/ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://imhuman.app"),
  title: {
    template: "%s — I’m human",
    default: "I’m human — Natural rewrites for AI drafts",
  },
  description: "Rewrite AI-drafted text so it sounds like you wrote it.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "I’m human — Natural rewrites for AI drafts",
    description: "Rewrite AI-drafted text so it sounds like you wrote it.",
    url: "https://imhuman.app",
    siteName: "I’m human",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "I’m human — Natural rewrites for AI drafts",
    description: "Rewrite AI-drafted text so it sounds like you wrote it.",
  },
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
  try {
    localStorage.removeItem(['imhuman', 'groq', 'key'].join('-'));
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
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap"
        />
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
            <Footer />
            <BottomNav />
            <Toaster />
            <ToastViewport />
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
