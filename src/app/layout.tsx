import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import Navigation from "@/components/Navigation";
import LockdownOverlay from "@/components/LockdownOverlay";

import { headers } from "next/headers";
import { store } from "@/lib/store";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "God Bless America — A Patriot's Blog",
  description: "A celebration of the greatest nation on earth — its values, its heroes, and the enduring spirit that makes America the beacon of liberty for the world.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
  
  if (store.isBlocked(ip) === 'banned') {
    return (
      <html lang="en">
        <head>
          <title>Access Denied</title>
          <meta httpEquiv="refresh" content="3; url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
        </head>
        <body style={{ backgroundColor: '#000', color: '#ff0000', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', border: '2px solid red', padding: '1rem' }}>⚠️ THREAT NEUTRALIZED ⚠️</h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.5 }}>
            Your IP address ({ip}) has been permanently banned by the Sentinel Core due to repeated malicious activity.
          </p>
          <p style={{ marginTop: '2rem', color: '#666' }}>Taking counter-measures in 3 seconds...</p>
        </body>
      </html>
    );
  }

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
