/** Search shared by the library filter (client) and /search (server). */
import { dafIdx } from "./daf";

type M = { slug: string; name: string; he: string; aliases: string[] };
type S = { masechta: string; number: number; daf_start: string; daf_end: string };

export const norm = (t: string) =>
  t.toLowerCase().normalize("NFKD").replace(/[֑-ׇ]/g, "").replace(/[’'"״׳]/g, "")
    .replace(/[^a-z0-9א-ת\s]/g, " ").replace(/\s+/g, " ").trim();

export function resolveMasechta<T extends M>(word: string, masechtos: T[]): T | null {
  const w = norm(word);
  return masechtos.find((m) => norm(m.name) === w || m.slug === w || m.he === word || m.aliases.includes(w)) ?? null;
}

export type DafResult<X> = { error: string } | { hit: X; daf: string } | { near: X; daf: string };

export function findDaf<X extends S>(shiurim: X[], daf: string): DafResult<X> {
  const d = daf.toLowerCase().replace(/^daf\s*/, "").trim();
  const x = /^(\d+)([ab])?$/.exec(d);
  if (!x) return { error: "Type a daf number like 17 or 17a." };
  const lo = dafIdx(x[1] + (x[2] || "a"))!, hi = x[2] ? lo : lo + 1;
  const label = x[1] + (x[2] || "");
  const hit = shiurim.find((s) => dafIdx(s.daf_start)! <= hi && dafIdx(s.daf_end)! >= lo);
  if (hit) return { hit, daf: label };
  const near = [...shiurim].sort((a, b) => Math.abs(dafIdx(a.daf_start)! - lo) - Math.abs(dafIdx(b.daf_start)! - lo))[0];
  return { near, daf: label };
}

/**
 * Parses "kesuvos 17a hillel" into a masechta, an optional daf and free-text terms,
 * then ranks shiurim whose text contains every term (title > summary > other text).
 */
export function search<Mx extends M, X extends S>(
  q: string, masechtos: Mx[], shiurim: X[], text: (s: X) => { title: string; summary: string; other?: string }, slug?: string,
) {
  const words = norm(q).split(" ").filter(Boolean);
  let m = slug ? masechtos.find((x) => x.slug === slug) ?? null : null;
  let dafHit: DafResult<X> | null = null;
  const terms: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const found = resolveMasechta(words[i], masechtos);
    if (found) {
      m = found;
      if (/^\d+[ab]?$/.test(words[i + 1] || "")) dafHit = findDaf(shiurim.filter((s) => s.masechta === found.slug), words[++i]);
    } else if (m && !dafHit && /^\d+[ab]?$/.test(words[i])) {
      const mm = m;
      dafHit = findDaf(shiurim.filter((s) => s.masechta === mm.slug), words[i]);
    } else terms.push(words[i]);
  }
  const pool = m ? shiurim.filter((s) => s.masechta === m!.slug) : shiurim;
  if (!terms.length) return { m, dafHit, terms, results: dafHit ? [] : pool };
  const results = pool
    .map((s) => {
      const t = text(s), tt = norm(t.title), su = norm(t.summary), ot = norm(t.other ?? "");
      let score = 0;
      for (const w of terms) {
        if (tt.includes(w)) score += 5; else if (su.includes(w)) score += 3; else if (ot.includes(w)) score += 1; else return null;
      }
      return { s, score };
    })
    .filter((r): r is { s: X; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.s);
  return { m, dafHit, terms, results };
}
