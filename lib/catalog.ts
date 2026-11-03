import "server-only";
import fs from "node:fs";
import path from "node:path";
import { SITE } from "./site";
import type { Masechta, ShiurFile, ShiurLite } from "./types";

const ROOT = path.join(process.cwd(), "content");

let cache: { masechtos: Masechta[]; shiurim: ShiurFile[] } | null = null;

function load() {
  if (cache) return cache;
  const masechtos: Masechta[] = JSON.parse(fs.readFileSync(path.join(ROOT, "masechtos.json"), "utf8"));
  const shiurim: ShiurFile[] = [];
  for (const m of masechtos) {
    const dir = path.join(ROOT, "shiurim", m.slug);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      shiurim.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    }
  }
  cache = { masechtos, shiurim };
  return cache;
}

/** Only published shiurim are ever shown on the site or in the feed. */
export function published(): ShiurFile[] {
  return load().shiurim.filter((s) => s.status === "published");
}

/** Masechtos that have at least one published shiur, in library order. */
export function masechtos(): Masechta[] {
  const live = new Set(published().map((s) => s.masechta));
  return load().masechtos.filter((m) => live.has(m.slug)).sort((a, b) => a.order - b.order);
}

export function masechta(slug: string): Masechta | undefined {
  return masechtos().find((m) => m.slug === slug);
}

export function audioUrl(s: Pick<ShiurFile, "masechta" | "audio">): string | null {
  return SITE.audioBase ? `${SITE.audioBase}/${s.masechta}/${s.audio.file}` : null;
}

export function lite(s: ShiurFile): ShiurLite {
  const m = load().masechtos.find((x) => x.slug === s.masechta)!;
  const { transcript: _t, ...rest } = s;
  return {
    ...rest, id: `${s.masechta}-${s.number}`, href: `/${s.masechta}/${s.number}`,
    masechtaName: m.name, masechtaHe: m.he, audioUrl: audioUrl(s),
  };
}

/** Shiurim in learning order: by masechta, then shiur number. */
export function inOrder(): ShiurFile[] {
  const order = new Map(load().masechtos.map((m) => [m.slug, m.order]));
  return [...published()].sort((a, b) => order.get(a.masechta)! - order.get(b.masechta)! || a.number - b.number);
}

/** Newest first by date given; shiurim without a date fall back to reverse learning order. */
export function newest(): ShiurFile[] {
  return [...inOrder()].reverse().sort((a, b) => (b.given_on ?? "").localeCompare(a.given_on ?? ""));
}

export function shiur(slug: string, n: number): ShiurFile | undefined {
  return published().find((s) => s.masechta === slug && s.number === n);
}

/** The weekly feed: published, in the feed, dated (pubDate is the date given), and in a masechta with a podcast season. */
export function feedItems(): ShiurFile[] {
  const inPodcast = new Set(load().masechtos.filter((m) => m.season != null).map((m) => m.slug));
  return newest().filter((s) => s.in_feed && s.given_on && inPodcast.has(s.masechta));
}
