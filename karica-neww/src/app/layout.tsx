import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karica - Semplifica la tua efficienza energetica",
  description: "Analizza le tue bollette e ottimizza i tuoi consumi con Karica.",
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative overflow-x-hidden selection:bg-[#45FF4A]/30 selection:text-[#203149]`}
      >
        {/* Aurora Background Effects - Strict Palette */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#45FF4A]/20 blur-[100px] pointer-events-none z-[-1] animate-pulse-soft" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#0C86C7]/20 blur-[100px] pointer-events-none z-[-1] animate-pulse-soft" style={{ animationDelay: '1s' }} />

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
