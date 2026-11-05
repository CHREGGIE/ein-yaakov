import { dafRange } from "./daf";
import { SITE } from "./site";
import type { Masechta, ShiurFile, ShiurLite } from "./types";

/** ISO 8601 duration, e.g. 2664 -> "PT44M24S". */
export function isoDuration(sec: number): string {
  const s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${r || (!h && !m) ? `${r}S` : ""}`;
}

/** The sefer itself, tied to its Wikipedia entry so search engines know which "Ein Yaakov" this is. */
export const einYaakovLd = {
  "@type": "Book",
  "@id": `${SITE.url}/#ein-yaakov`,
  name: "Ein Yaakov",
  alternateName: ["Ein Yakov", "Ein Ya'akov", "Eyn Yaakov", "עין יעקב"],
  author: { "@type": "Person", name: "Yaakov ibn Chaviv", alternateName: "Jacob ibn Habib" },
  inLanguage: ["he", "arc"],
  sameAs: ["https://en.wikipedia.org/wiki/Ein_Yaakov"],
};

/** The Rav, as one schema.org entity every page refers to by @id. */
export const ravLd = {
  "@type": "Person",
  "@id": `${SITE.url}/about#rav`,
  name: SITE.rav,
  url: `${SITE.url}/about`,
  image: `${SITE.url}/rabbi.jpg`,
  jobTitle: "Rabbi",
};

/** The organization behind the site, with the ע logo, so Google can show the site's name and logo. */
export const orgLd = {
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  alternateName: ["Ein Yaakov Shiur", "einyaakovshiur.com"],
  url: SITE.url,
  logo: { "@type": "ImageObject", "@id": `${SITE.url}/#logo`, url: `${SITE.url}/icon.png`, width: 512, height: 512, caption: SITE.name },
  image: { "@id": `${SITE.url}/#logo` },
  description: SITE.description,
  founder: { "@id": ravLd["@id"] },
  sameAs: Object.values(SITE.listen).filter(Boolean),
};

/** The show, linked to its pages in the podcast apps. */
export const seriesLd = {
  "@type": "PodcastSeries",
  "@id": `${SITE.url}/#series`,
  name: SITE.name,
  alternateName: ["Ein Yaakov Shiur", "Ein Yaakov Podcast"],
  description: SITE.podcastDescription,
  url: SITE.url,
  image: `${SITE.url}/cover.jpg`,
  inLanguage: "en",
  genre: ["Judaism", "Talmud", "Aggadah"],
  webFeed: `${SITE.url}/feed.xml`,
  author: { "@id": ravLd["@id"] },
  creator: { "@id": ravLd["@id"] },
  publisher: { "@id": orgLd["@id"] },
  about: { "@id": einYaakovLd["@id"] },
  sameAs: Object.values(SITE.listen).filter(Boolean),
};

export const websiteLd = {
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url,
  inLanguage: "en",
  publisher: { "@id": orgLd["@id"] },
  about: { "@id": einYaakovLd["@id"] },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

function seasonLd(m: Masechta) {
  return {
    "@type": "PodcastSeason",
    "@id": `${SITE.url}/${m.slug}#season`,
    name: `Ein Yaakov on ${m.name}`,
    url: `${SITE.url}/${m.slug}`,
    ...(m.season ? { seasonNumber: m.season } : {}),
    partOfSeries: { "@id": seriesLd["@id"] },
  };
}

/** A full episode: audio, length, season, episode number, and each chapter as a timed Clip. */
export function episodeLd(s: ShiurFile, m: Masechta, audioUrl: string | null) {
  const url = `${SITE.url}/${m.slug}/${s.number}`;
  const daf = `${m.name} ${dafRange(s)}`;
  const chapters = s.chapters.map((c, i) => ({
    "@type": "Clip",
    name: c.title,
    startOffset: c.start,
    ...(s.chapters[i + 1] ? { endOffset: s.chapters[i + 1].start } : { endOffset: s.audio.duration_sec }),
    url: `${url}#t=${c.start}`,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "@id": `${url}#episode`,
    url,
    name: `${daf}: ${s.title}`,
    headline: s.title,
    description: s.summary,
    ...(s.key_ideas?.length ? { abstract: s.key_ideas.join(" ") } : {}),
    ...(s.sources?.length ? { mentions: s.sources.map((x) => ({ "@type": "Thing", name: x.title })) } : {}),
    episodeNumber: s.number,
    ...(s.given_on ? { datePublished: s.given_on } : {}),
    inLanguage: "en",
    timeRequired: isoDuration(s.audio.duration_sec),
    keywords: ["Ein Yaakov", `Ein Yaakov ${m.name}`, daf, `Masechta ${m.name}`, m.he, "aggadah", "Gemara", "shiur"].join(", "),
    image: `${SITE.url}/cover.jpg`,
    ...(audioUrl ? {
      associatedMedia: {
        "@type": "AudioObject",
        contentUrl: audioUrl,
        encodingFormat: "audio/mpeg",
        duration: isoDuration(s.audio.duration_sec),
        contentSize: `${s.audio.bytes} B`,
      },
    } : {}),
    hasPart: chapters,
    partOfSeason: seasonLd(m),
    partOfSeries: { "@id": seriesLd["@id"] },
    author: { "@id": ravLd["@id"] },
    about: [{ "@id": einYaakovLd["@id"] }, { "@type": "Thing", name: `Masechta ${m.name}`, alternateName: m.he }],
  };
}

/** The episodes of one masechta, in order, for its listing page. */
export function masechtaListLd(m: Masechta, shiurim: ShiurLite[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      seasonLd(m),
      {
        "@type": "ItemList",
        name: `Ein Yaakov on ${m.name}: every shiur`,
        numberOfItems: shiurim.length,
        itemListElement: shiurim.map((s, i) => ({
          "@type": "ListItem", position: i + 1, url: `${SITE.url}${s.href}`, name: `${m.name} ${dafRange(s)}: ${s.title}`,
        })),
      },
    ],
  };
}

export function breadcrumbsLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}${it.path}` })),
  };
}
