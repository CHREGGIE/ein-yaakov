import { audioUrl, feedItems, masechtos } from "@/lib/catalog";
import { dafRange } from "@/lib/daf";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hms = (sec: number) => [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), Math.floor(sec % 60)].map((n) => String(n).padStart(2, "0")).join(":");
/** pubDate is the date the shiur was given; 20:00 UTC keeps it on the same calendar day in the US. */
const pubDate = (iso: string) => new Date(iso + "T20:00:00Z").toUTCString();
const op3 = (url: string) => (SITE.op3 ? `https://op3.dev/e/${url.replace(/^https?:\/\//, "")}` : url);

export function GET() {
  const bySlug = new Map(masechtos().map((m) => [m.slug, m]));
  const items = feedItems().map((s) => {
    const m = bySlug.get(s.masechta)!;
    const url = audioUrl(s);
    const link = `${SITE.url}/${s.masechta}/${s.number}`;
    // The daf leads the title: it is what people search for ("Ein Yaakov Kesuvos 62a").
    const title = `Ein Yaakov ${m.name} ${dafRange(s)}: ${s.title}`;
    // "00:00 Title" lines become chapters in Spotify, Apple Podcasts and YouTube.
    const chapters = s.chapters.length >= 3 && s.chapters[0].start === 0
      ? "\n\nChapters:\n" + s.chapters.map((c) => `${hms(c.start)} ${c.title}`).join("\n")
      : "";
    return `
    <item>
      <title>${esc(title)}</title>
      <description>${esc(`${s.summary}${s.key_ideas?.length ? "\n\nKey ideas:\n" + s.key_ideas.map((k) => `• ${k}`).join("\n") : ""}${chapters}\n\nEin Yaakov ${m.name} ${dafRange(s)}, shiur ${s.number}, with ${SITE.rav}. Summary, sources and chapters: ${link}`)}</description>
      <link>${link}</link>
      <guid isPermaLink="false">${s.guid}</guid>
      <pubDate>${pubDate(s.given_on!)}</pubDate>
      ${url ? `<enclosure url="${esc(op3(url))}" length="${s.audio.bytes}" type="audio/mpeg"/>` : ""}
      <itunes:duration>${hms(s.audio.duration_sec)}</itunes:duration>
      <itunes:season>${m.season}</itunes:season>
      <itunes:episode>${s.number}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${SITE.url}</link>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(SITE.podcastDescription)}</description>
    <itunes:summary>${esc(SITE.podcastDescription)}</itunes:summary>
    <language>en</language>
    <itunes:author>${esc(SITE.rav)}</itunes:author>
    <itunes:owner><itunes:name>${esc(SITE.ownerName || SITE.rav)}</itunes:name>${SITE.ownerEmail ? `<itunes:email>${esc(SITE.ownerEmail)}</itunes:email>` : ""}</itunes:owner>
    <itunes:image href="${SITE.url}/cover.jpg"/>
    <image><url>${SITE.url}/cover.jpg</url><title>${esc(SITE.name)}</title><link>${SITE.url}</link></image>
    <itunes:category text="Religion &amp; Spirituality"><itunes:category text="Judaism"/></itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
