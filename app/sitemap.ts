import type { MetadataRoute } from "next";
import { masechtos, published } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const shiurim = published();
  // Newest given_on date in a set of shiurim; undefined when none are dated.
  const newest = (list: typeof shiurim) =>
    list.map((s) => s.given_on).filter((d): d is string => !!d).sort().at(-1);
  const lm = (d?: string | null) => (d ? { lastModified: d } : {});

  return [
    { url: SITE.url, ...lm(newest(shiurim)) },
    { url: `${SITE.url}/faq` }, { url: `${SITE.url}/about` }, { url: `${SITE.url}/dedication` },
    ...masechtos().map((m) => ({ url: `${SITE.url}/${m.slug}`, ...lm(newest(shiurim.filter((s) => s.masechta === m.slug))) })),
    ...shiurim.map((s) => ({ url: `${SITE.url}/${s.masechta}/${s.number}`, ...lm(s.given_on) })),
  ];
}
