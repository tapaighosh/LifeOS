import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/layout/Navigation";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";

const inter = Inter({ subsets: ["latin"] });

// ---------------------------------------------------------------------------
// Viewport — controls mobile theme-color and PWA display hints
// ---------------------------------------------------------------------------
export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ---------------------------------------------------------------------------
// App metadata — SEO + PWA
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: "LifeOS — Personal AI Life OS",
    template: "%s | LifeOS",
  },
  description:
    "Stop wondering what to do today. Let AI plan your day across work, wellness, and growth — then adapt when life happens.",
  applicationName: "LifeOS",
  keywords: ["productivity", "AI planning", "daily planner", "life OS", "habit tracker"],
  authors: [{ name: "Ty" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeOS",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "LifeOS — Personal AI Life OS",
    description: "AI-powered daily planning across work, wellness, and growth.",
    siteName: "LifeOS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* pb-16 = clearance for mobile bottom bar; md:pb-0 removes it on desktop */}
      {/* md:pl-16 = clearance for the 64px fixed left sidebar on desktop */}
      <body className={`${inter.className} min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 pb-16 md:pb-0 md:pl-16`}>
        <Providers>
          {children}
          <Navigation />
          {/* Show notification permission prompt on first visit */}
          <NotificationBanner />
        </Providers>
      </body>
    </html>
  );
}
