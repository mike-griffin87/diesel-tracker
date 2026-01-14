import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { SettingsMenu } from "./SettingsMenu";
import packageJson from '../../package.json';

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

const APP_VERSION = packageJson.version;

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
          <Link href="/" className="brand">
            ⛽ Diesel Tracker {APP_VERSION ? <span className="version">v{APP_VERSION}</span> : null}
          </Link>
          <nav>
            <Link href="/?new=1" className="btn btnPrimary" aria-label="Add a new fill entry" role="button">+ Add a fill</Link>
            <SettingsMenu />
          </nav>
        </header>
        <main className="container">
          {children}
        </main>

        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname) || location.hostname.endsWith('.local');
  if (!isLocal) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  } else {
    // In development, do not use a SW and clean up any old registrations
    navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(r => r.unregister()));
    caches?.keys?.().then(keys => keys.forEach(k => caches.delete(k)));
  }
}
`,
          }}
        />
      </body>
    </html>
  );
}
