import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/layout/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Personal AI-powered life operating system",
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
        </Providers>
      </body>
    </html>
  );
}
