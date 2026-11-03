import type { Metadata } from "next";
import Link from "next/link";
import { inOrder, lite, masechtos } from "@/lib/catalog";
import { dafRange } from "@/lib/daf";
import { search } from "@/lib/search";
import { EpItem } from "@/components/Library";
import { SearchIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Search" };

/** Search over title and summary, plus the hidden automatic transcript as a weak signal. Rendered on the server. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 200);
  const ms = masechtos();
  const all = inOrder();
  const r = q ? search(q, ms, all, (s) => ({ title: s.title, summary: s.summary, other: s.transcript.map((p) => p.text).join(" ") })) : null;
  const dh = r?.dafHit;
  const list = dh && !("error" in dh) ? ["hit" in dh ? dh.hit : dh.near] : r?.results ?? [];
  return (
    <section className="main-col" style={{ maxWidth: "52rem" }}>
      <h1 className="title">Search</h1>
      <div className="panel">
        <form className="tools" action="/search">
          <label className="searchbox"><SearchIcon /><input id="q" name="q" type="search" defaultValue={q} placeholder="A topic, a story, or a masechta and daf" aria-label="Search" /></label>
          <button className="btn">Search</button>
        </form>
        {!r && <p className="empty">Searches shiur titles and summaries, and finds the shiur for any masechta and daf.</p>}
        {dh && <div className="notice">{"error" in dh ? dh.error : "hit" in dh
          ? <>{r!.m!.name} {dh.daf} is covered in <Link href={`/${dh.hit.masechta}/${dh.hit.number}`}>Shiur {dh.hit.number}</Link>.</>
          : <>No shiur covers {r!.m!.name} {dh.daf} yet. The closest is Shiur {dh.near.number} on {dafRange(dh.near)}.</>}</div>}
        {r && !dh && <div className="count num">{list.length} result{list.length === 1 ? "" : "s"}</div>}
        {r && (list.length
          ? <ul className="eps">{list.map((s) => <EpItem key={s.number + s.masechta} s={lite(s)} terms={r.terms} />)}</ul>
          : !dh && <p className="empty">Nothing matched “{q}”. Try fewer or different words.</p>)}
      </div>
    </section>
  );
}
