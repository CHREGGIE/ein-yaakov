import type { MetadataRoute } from "next";
import { masechtos, published } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url }, { url: `${SITE.url}/faq` }, { url: `${SITE.url}/about` }, { url: `${SITE.url}/dedication` },
    ...masechtos().map((m) => ({ url: `${SITE.url}/${m.slug}` })),
    ...published().map((s) => ({ url: `${SITE.url}/${s.masechta}/${s.number}`, ...(s.given_on ? { lastModified: s.given_on } : {}) })),
  ];
}
