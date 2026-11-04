import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lite, masechta, published, shiur } from "@/lib/catalog";
import { dafRange, fmtDate, heRange, mins } from "@/lib/daf";
import { SITE } from "@/lib/site";
import { Cover } from "@/components/Cover";
import { ChapterList, PlayButton, PlayLabel } from "@/components/Player";
import { RavPhoto } from "@/components/RavPhoto";
import { SideBlocks } from "@/components/Side";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbsLd, episodeLd } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return published().map((s) => ({ masechta: s.masechta, number: String(s.number) }));
}

type P = { params: Promise<{ masechta: string; number: string }> };
async function get(params: P["params"]) {
  const p = await params;
  const m = masechta(p.masechta), s = shiur(p.masechta, Number(p.number));
  return m && s ? { m, s } : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await get(params);
  if (!r) return {};
  return {
    title: { absolute: `Ein Yaakov ${r.m.name} ${dafRange(r.s)}: ${r.s.title} | Rabbi Fogelman` },
    description: `${r.m.name} ${dafRange(r.s)} (${r.m.he}) in the Ein Yaakov. ${r.s.summary}`.slice(0, 300),
    alternates: { canonical: `/${r.m.slug}/${r.s.number}` },
    openGraph: { type: "article", title: `${r.m.name} ${dafRange(r.s)}: ${r.s.title}`, description: r.s.summary },
  };
}

export default async function ShiurPage({ params }: P) {
  const r = await get(params);
  if (!r) notFound();
  const { m, s } = r;
  const l = lite(s);
  const siblings = published().filter((x) => x.masechta === m.slug).sort((a, b) => a.number - b.number);
  const i = siblings.findIndex((x) => x.number === s.number);
  const prev = siblings[i - 1], next = siblings[i + 1];
  const jsonLd = episodeLd(s, m, l.audioUrl);
  return (
    <div className="layout shiur-page">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbsLd([{ name: "Shiurim", path: "/" }, { name: m.name, path: `/${m.slug}` }, { name: `Shiur ${s.number}`, path: `/${m.slug}/${s.number}` }])} />
      <div className="side-top">
        <Cover he={m.he} en={m.name} />
        <div className="rav"><RavPhoto /><div className="by"><span className="show-name">Ein Yaakov on {m.name}</span>Given by<b>{SITE.rav}</b></div></div>
        <div className="actions">{l.audioUrl ? <a className="btn" href={l.audioUrl} download>Download MP3</a> : <button className="btn" disabled>Download coming soon</button>}</div>
      </div>
      <div className="side-more">
        <div className="block"><dl className="num">
          <dt>Masechta</dt><dd>{m.name} <span className="he" lang="he">{m.he}</span></dd>
          <dt>Daf</dt><dd>{dafRange(s)}</dd>
          <dt>Shiur</dt><dd>{s.number} of {siblings.length}</dd>
          <dt>Given</dt><dd>{fmtDate(s.given_on)}</dd>
          <dt>Length</dt><dd>{mins(s.audio.duration_sec)}</dd>
        </dl></div>
        <SideBlocks />
      </div>
      <section className="main-col">
        <nav className="crumbs"><Link href="/">Shiurim</Link><span>›</span><Link href={`/${m.slug}`}>{m.name}</Link><span>›</span><span>Shiur {s.number}</span></nav>
        <div style={{ display: "grid", gap: ".75rem" }}>
          <span className="eyebrow num">{m.name} · Shiur {s.number}{s.label ? ` · ${s.label}` : ""} · {fmtDate(s.given_on)}</span>
          <h1 className="title">{s.title}</h1>
          <div className="dafline"><span className="num">Daf {dafRange(s)}</span><span className="he" lang="he">{m.he} {heRange(s)}</span></div>
        </div>
        <div className="playrow"><PlayButton s={l} variant="big" /><PlayLabel s={l} chapters={s.chapters.length} /></div>
        <p className="summary">{s.summary}</p>
        {s.dedication && <p className="dedication">{s.dedication}</p>}
        <div className="panel">
          <div className="tabs"><span className="tab" aria-selected="true">Chapters</span></div>
          <ChapterList s={l} />
        </div>
        <nav className="pn" aria-label="Previous and next shiur">
          {prev ? <Link href={`/${m.slug}/${prev.number}`}><small>← Shiur {prev.number} · {dafRange(prev)}</small><b>{prev.title}</b></Link> : <span />}
          {next ? <Link className="next" href={`/${m.slug}/${next.number}`}><small>Shiur {next.number} · {dafRange(next)} →</small><b>{next.title}</b></Link> : <span />}
        </nav>
      </section>
    </div>
  );
}
