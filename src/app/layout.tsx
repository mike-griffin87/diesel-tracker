import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diesel Tracker",
  description: "Track diesel fills, price (c/L), and cost.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111827" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="topbar">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" className="brand" style={{ fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>
              ⛽ Diesel Tracker
            </Link>
            <nav>
              <Link href="/new" style={{ textDecoration: 'none', color: 'inherit', opacity: 0.85 }}>New Fill</Link>
            </nav>
          </div>
        </header>
        <main className="container">
          {children}
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
`,
          }}
        />
      </body>
    </html>
  );
}
