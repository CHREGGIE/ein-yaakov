import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { lite, newest } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { PlayerProvider } from "@/components/Player";
import { SearchIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { einYaakovLd, orgLd, ravLd, seriesLd, websiteLd } from "@/lib/seo";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `Ein Yaakov Shiur and Podcast with ${SITE.rav}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: SITE.name }] } },
  openGraph: { siteName: SITE.name, type: "website" },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#1d3fd1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const latest = newest()[0];
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Frank+Ruhl+Libre:wght@500;700&display=swap" />
      </head>
      <body>
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [websiteLd, orgLd, seriesLd, ravLd, einYaakovLd] }} />
        <PlayerProvider initial={latest ? lite(latest) : null}>
          <header className="top">
            <div className="top-in">
              <Link className="word" href="/">EIN YAAKOV</Link>
              <nav><Link href="/">Shiurim</Link><Link href="/faq">FAQ</Link><Link href="/about">About</Link></nav>
              <Link className="icon-btn" href="/search" aria-label="Search shiurim"><SearchIcon /></Link>
            </div>
          </header>
          <main className="page">{children}</main>
          <Footer />
        </PlayerProvider>
      </body>
    </html>
  );
}
