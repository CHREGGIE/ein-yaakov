import { SITE } from "./site";

/** The Rav, as one schema.org entity every page refers to by @id. */
export const ravLd = {
  "@type": "Person",
  "@id": `${SITE.url}/about#rav`,
  name: SITE.rav,
  url: `${SITE.url}/about`,
  image: `${SITE.url}/rabbi.jpg`,
  jobTitle: "Rabbi",
};

/** The show, linked to its pages in the podcast apps. */
export const seriesLd = {
  "@type": "PodcastSeries",
  "@id": `${SITE.url}/#series`,
  name: SITE.name,
  description: SITE.podcastDescription,
  url: SITE.url,
  image: `${SITE.url}/cover.jpg`,
  inLanguage: "en",
  webFeed: `${SITE.url}/feed.xml`,
  author: { "@id": ravLd["@id"] },
  sameAs: Object.values(SITE.listen).filter(Boolean),
};

export function breadcrumbsLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}${it.path}` })),
  };
}
