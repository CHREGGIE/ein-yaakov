"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dafRange, fmtDate, mins } from "@/lib/daf";
import { norm, search } from "@/lib/search";
import type { Masechta, ShiurLite } from "@/lib/types";
import { SearchIcon } from "./Icons";
import { PlayButton } from "./Player";

function hl(text: string, terms: string[]) {
  const ts = terms.filter((t) => t.length > 1);
  if (!ts.length) return text;
  const re = new RegExp(`(${ts.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

export function EpItem({ s, terms = [], showM = true }: { s: ShiurLite; terms?: string[]; showM?: boolean }) {
  return (
    <li className="ep">
      <PlayButton s={s} />
      <Link className="ep-body" href={s.href}>
        <span className="ep-meta num">
          <span>{showM ? `${s.masechtaName} ${dafRange(s)}` : `Daf ${dafRange(s)}`}</span>
          <span className="dot">{fmtDate(s.given_on)}</span>
          <span className="dot">{mins(s.audio.duration_sec)}</span>
          {s.in_feed && <span className="tag">Podcast</span>}
        </span>
        <span className="ep-title">{showM ? "" : `Shiur ${s.number}: `}{hl(s.title, terms)}</span>
        <p className="ep-sum">{hl(s.summary, terms)}</p>
      </Link>
    </li>
  );
}

export function Library({ masechtos, shiurim, active }: { masechtos: Masechta[]; shiurim: ShiurLite[]; active?: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "order">(active ? "order" : "new");
  const m = active ? masechtos.find((x) => x.slug === active) : undefined;

  const r = useMemo(() => search(q, masechtos, shiurim, (s) => ({ title: s.title, summary: s.summary }), active), [q, masechtos, shiurim, active]);
  let list = r.dafHit && !("error" in r.dafHit) ? ["hit" in r.dafHit ? r.dafHit.hit : r.dafHit.near] : r.dafHit ? [] : [...r.results];
  if (!r.terms.length && !r.dafHit) {
    const season = new Map(masechtos.map((x) => [x.slug, x.season]));
    list.sort(sort === "new"
      ? (a, b) => (b.given_on ?? "").localeCompare(a.given_on ?? "") || season.get(b.masechta)! - season.get(a.masechta)! || b.number - a.number
      : (a, b) => season.get(a.masechta)! - season.get(b.masechta)! || a.number - b.number);
  }
  const showM = !active || (r.m != null && r.m.slug !== active);
  const dm = r.m;
  const notice = !r.dafHit ? null : "error" in r.dafHit ? r.dafHit.error : "hit" in r.dafHit
    ? <>{dm!.name} {r.dafHit.daf} is covered in <Link href={r.dafHit.hit.href}>Shiur {r.dafHit.hit.number}</Link>.</>
    : <>No shiur covers {dm!.name} {r.dafHit.daf} yet. The closest is <Link href={r.dafHit.near.href}>Shiur {r.dafHit.near.number} on {dafRange(r.dafHit.near)}</Link>.</>;
  const pool = dm ? shiurim.filter((s) => s.masechta === dm.slug) : shiurim;
  const label = r.terms.length ? `${list.length} result${list.length === 1 ? "" : "s"}${dm ? " in " + dm.name : ""}`
    : r.dafHit ? "" : `${list.length} shiurim${dm && pool.length ? ` · Daf ${pool[0].daf_start}–${pool[pool.length - 1].daf_end}` : ""}`;

  return (
    <div className="panel">
      <div className="tabs" role="tablist" aria-label="Masechta">
        <Link className="tab" role="tab" href="/" aria-selected={!m}>All shiurim</Link>
        {masechtos.map((x) => <Link key={x.slug} className="tab" role="tab" href={`/${x.slug}`} aria-selected={m?.slug === x.slug}>{x.name}</Link>)}
      </div>
      <div className="tools">
        <label className="searchbox"><SearchIcon />
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" aria-label="Search shiurim"
            placeholder={m ? `Search ${m.name} or type a daf` : "Search a topic, masechta or daf"} />
        </label>
        <div className="seg" role="group" aria-label="Order">
          <button aria-pressed={sort === "new"} onClick={() => setSort("new")}>Newest</button>
          <button aria-pressed={sort === "order"} onClick={() => setSort("order")}>{m ? "By daf" : "In order"}</button>
        </div>
      </div>
      {!q && <p className="hint">Search a topic, or type a masechta and daf like <code>{masechtos[0]?.name} {shiurim[0]?.daf_start}</code>. For words said inside a shiur, use <Link href="/search">full-text search</Link>.</p>}
      {notice && <div className="notice">{notice}</div>}
      {label && <div className="count num">{label}</div>}
      {list.length ? (
        <ul className="eps">{list.map((s) => <EpItem key={s.id} s={s} terms={r.terms} showM={showM} />)}</ul>
      ) : (
        <p className="empty">Nothing matched “{q}”{dm ? " in " + dm.name : ""}. Try fewer words, or <Link href={`/search?q=${encodeURIComponent(norm(q))}`}>search inside the shiurim</Link>.</p>
      )}
    </div>
  );
}
