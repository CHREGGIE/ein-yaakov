import "server-only";
import fixes from "@/content/transcript-fixes.json";
import type { Chapter, Paragraph } from "@/lib/types";

const pairs = Object.entries(fixes as Record<string, string>)
  .filter(([k]) => !k.startsWith("_"))
  .sort((a, b) => b[0].length - a[0].length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re = new RegExp(`(?<![\\w'-])(${pairs.map(([k]) => esc(k)).join("|")})(?![\\w'-])`, "g");
const map = new Map(pairs);

/** Apply the known Whisper corrections (content/transcript-fixes.json) to transcript text. */
export const tidy = (text: string) => text.replace(re, (m) => map.get(m) ?? m);

/** The transcript grouped under the shiur's chapters, for display. */
export function byChapter(chapters: Chapter[], paras: Paragraph[]) {
  const cs = [...chapters].sort((a, b) => a.start - b.start);
  return cs.map((c, i) => {
    const end = cs[i + 1]?.start ?? Infinity;
    return { ...c, paras: paras.filter((p) => p.start >= c.start && p.start < end).map((p) => ({ ...p, text: tidy(p.text) })) };
  }).filter((c) => c.paras.length);
}
