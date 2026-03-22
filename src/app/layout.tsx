import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import Navigation from "@/components/Navigation";
import LockdownOverlay from "@/components/LockdownOverlay";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "God Bless America — A Patriot's Blog",
  description: "A celebration of the greatest nation on earth — its values, its heroes, and the enduring spirit that makes America the beacon of liberty for the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistMono.variable} antialiased min-h-screen`}
      >
        <LockdownOverlay />
        {/* Official Government Banner */}
        <div className="gov-banner">
          <span>🇺🇸 An official blog celebrating the United States of America</span>
        </div>
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
