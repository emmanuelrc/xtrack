// app/layout.tsx

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
  title: "xTrack",
  description: "The next big app for radiation dose monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        // Keep fonts wired and apply global text/background + a sane baseline
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans min-h-dvh bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
