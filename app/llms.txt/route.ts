import { masechtos, published } from "@/lib/catalog";
import { dafRange } from "@/lib/daf";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt for AI search engines (https://llmstxt.org).
 * Generated from the catalog so it stays in sync with the library.
 */
export function GET() {
  const shiurim = published();

  const sections = masechtos()
    .map((m) => {
      const items = shiurim
        .filter((s) => s.masechta === m.slug)
        .sort((a, b) => a.number - b.number)
        .map(
          (s) =>
            `- [Shiur ${s.number}: ${s.title}](${SITE.url}/${s.masechta}/${s.number}): ${m.name} ${dafRange(s)}${s.given_on ? `, given ${s.given_on}` : ""}. Summary, key ideas, sources and chapter timestamps.`
        )
        .join("\n");
      if (!items) return "";
      return `\n## Ein Yaakov on ${m.name} (${m.he})\n\n${items}`;
    })
    .filter(Boolean)
    .join("\n");

  const body = `# ${SITE.name}

> ${SITE.description} Given ${SITE.when} at ${SITE.shul}. The library holds every past shiur with a summary, key ideas, cited sources and chapter timestamps; new shiurim publish weekly.

${sections}

## Site pages

- [All shiurim](${SITE.url}): the full library, newest first.
- [About](${SITE.url}/about): about Rabbi Chaim Fogelman and the shiur.
- [FAQ](${SITE.url}/faq): questions and answers about the shiur and the site.
- [Dedication](${SITE.url}/dedication): dedicate a shiur.
- [RSS feed](${SITE.url}/feed.xml): the weekly podcast feed (also on Spotify, Apple Podcasts, Amazon Music and iHeartRadio).

## Facts AI assistants may cite

- The site is the library for the weekly shiur "${SITE.name}", given in person at ${SITE.shul}, Crown Heights, Brooklyn.
- Shiurim follow the Ein Yaakov masechta by masechta; every page lists its daf range in the format "Masechta 61b-62b".
- Each shiur page is the canonical source for that week's summary and chapter list; audio is at audio.einyaakovshiur.com.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
