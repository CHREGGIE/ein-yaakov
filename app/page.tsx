import Link from "next/link";
import { inOrder, lite, masechtos, newest } from "@/lib/catalog";
import { dafRange, fmtDate, mins } from "@/lib/daf";
import { SITE } from "@/lib/site";
import { Cover } from "@/components/Cover";
import { Library } from "@/components/Library";
import { PlayButton } from "@/components/Player";
import { SideBlocks } from "@/components/Side";

export default function Home() {
  const all = inOrder().map(lite);
  const latest = lite(newest()[0]);
  const ms = masechtos();
  const hours = Math.round(all.reduce((a, s) => a + s.audio.duration_sec, 0) / 3600);
  return (
    <div className="layout">
      <div className="side-top">
        <Cover />
        <div className="by"><h1 className="show-name">{SITE.short}</h1>Given by<b>{SITE.rav}</b></div>
        <div className="actions"><a className="btn" href="/feed.xml">Podcast feed</a></div>
      </div>
      <div className="side-more"><SideBlocks /></div>
      <section className="main-col">
        <p className="lede"><b>{SITE.name}</b>, a weekly shiur on the aggados of the Gemara. Follow along each week, or learn at your own pace from the library.</p>
        <div className="week">
          <div className="week-top"><span className="eyebrow">Latest shiur</span>
            <span className="now">Now learning <b>{latest.masechtaName}</b><span className="he" lang="he">{latest.masechtaHe}</span></span></div>
          <div className="week-ep">
            <PlayButton s={latest} variant="big" />
            <Link href={latest.href}>
              <span className="ep-meta num"><span>{latest.masechtaName} {dafRange(latest)}</span><span className="dot">{fmtDate(latest.given_on)}</span><span className="dot">{mins(latest.audio.duration_sec)}</span></span>
              <span className="week-title">{latest.title}</span>
            </Link>
          </div>
          <p>{latest.summary}</p>
          <div className="week-sub"><span>A new shiur every week in your podcast app</span>
            <div className="actions"><a className="chip-l" href="/feed.xml">Podcast feed (RSS)</a></div></div>
        </div>
        <div className="lib-head">
          <div><span className="eyebrow">The library</span><h2 className="h2">Every shiur, by masechta</h2>
            <p>Start any masechta from the beginning, jump to a daf, or search for a topic.</p></div>
          <div className="stats num">
            <div className="stat"><small>Shiurim</small><b>{all.length}</b></div>
            <div className="stat"><small>Masechtos</small><b>{ms.length}</b></div>
            <div className="stat"><small>Hours</small><b>{hours}</b></div>
          </div>
        </div>
        <Library masechtos={ms} shiurim={all} />
      </section>
    </div>
  );
}
