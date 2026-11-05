import Link from "next/link";
import { masechtos } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { RavPhoto } from "./RavPhoto";
import { DedicationLine } from "./DedicationLine";

const APPS = [
  { key: "spotify", label: "Spotify" },
  { key: "apple", label: "Apple Podcasts" },
  { key: "amazon", label: "Amazon Music" },
  { key: "iheart", label: "iHeartRadio" },
] as const;

export function Footer() {
  const ms = masechtos();
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <div className="rav"><RavPhoto /><div>
            <b className="foot-name">{SITE.name}</b>
            <span className="he foot-he" lang="he">עין יעקב</span>
          </div></div>
          <p>A weekly shiur on the aggados of the Gemara, masechta by masechta. Given {SITE.when} at {SITE.shul}. Everyone is welcome.</p>
        </div>
        <nav className="foot-col" aria-label="Masechtos">
          <b>Masechtos</b>
          {ms.map((m) => <Link key={m.slug} href={`/${m.slug}`}>Ein Yaakov {m.name} <span className="he" lang="he">{m.he}</span></Link>)}
        </nav>
        <nav className="foot-col" aria-label="Site">
          <b>The shiur</b>
          <Link href="/">All shiurim</Link>
          <Link href="/faq">Questions and answers</Link>
          <Link href="/about">About {SITE.rav}</Link>
          <Link href="/dedication">L&apos;iluy nishmas</Link>
          <Link href="/search">Search</Link>
        </nav>
        <nav className="foot-col" aria-label="Listen">
          <b>Listen</b>
          {APPS.filter((a) => SITE.listen[a.key]).map((a) => (
            <a key={a.key} href={SITE.listen[a.key]} target="_blank" rel="noopener">{a.label}</a>
          ))}
          <a href="/feed.xml">RSS feed</a>
        </nav>
      </div>
      <div className="foot-ded"><DedicationLine /></div>
      <div className="foot-base">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <span>Tuesdays 8pm · Itchkes Shtiebel</span>
      </div>
    </footer>
  );
}
