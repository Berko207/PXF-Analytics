import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PXF Analytics | Sonora MMA Intelligence",
  description:
    "Professional fight card analytics and win probability insights for PXF and Sonora regional MMA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.variable,
          geistMono.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
