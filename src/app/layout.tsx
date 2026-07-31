import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EntryScreen } from "@/components/EntryScreen";
import { TopNav } from "@/components/TopNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BooTube — films, series, docs & live TV. No ads.",
  description:
    "40,000+ full-length openly licensed films, series and documentaries plus 8,000+ free live channels. No ads, no tracking, instant playback.",
  icons: {
    icon: "/icon-512.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BooTube",
    description: "Films, series, docs, books and live TV. No ads.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://archive.org" />
        <link rel="dns-prefetch" href="https://archive.org" />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <EntryScreen />
        <TopNav />
        <main className="pt-16">{children}</main>
        <footer className="mt-16 border-t border-white/5 px-4 py-10 text-xs text-muted sm:px-8">
          <p>
            BooTube streams only openly licensed and public domain material,
            sourced from the Internet Archive and the open IPTV-org channel index.
          </p>
          <p className="mt-1">No ads. No trackers. No accounts required.</p>
        </footer>
      </body>
    </html>
  );
}
