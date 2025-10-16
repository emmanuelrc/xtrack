// app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

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
  // optional, helps with address-bar coloring on mobile
  // themeColor: [{ media: "(prefers-color-scheme: light)", color: "white" }, { media: "(prefers-color-scheme: dark)", color: "black" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans min-h-dvh bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
