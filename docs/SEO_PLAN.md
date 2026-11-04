# SEO and AEO plan — einyaakovshiur.com

Goal: when someone searches for an Ein Yaakov topic, a daf of the masechta we've covered, or a story
from the Gemara, a page on this site comes up in Google and Bing, and AI answer engines (Google AI
Overviews, ChatGPT search, Perplexity, Copilot) quote and link it.

## Where the site stands

Already in place: server-rendered pages, a sitemap, PodcastEpisode structured data on each shiur,
a custom domain, and fast static pages.

Gaps:
- No `robots.txt`, canonical URLs, or per-page social previews.
- No structured data for the show (PodcastSeries), the Rav (Person), breadcrumbs, or FAQs.
- Thin pages: with transcripts hidden, each shiur page is a title, a paragraph and chapters. That is
  the biggest ranking problem to fix.
- Not yet registered with Google Search Console or Bing Webmaster Tools. Bing matters for AEO: it
  powers ChatGPT search and Copilot.

## What people search for

| Intent | Example searches | Page that should answer |
| --- | --- | --- |
| What it is | what is Ein Yaakov, who wrote Ein Yaakov, Ein Yaakov meaning | /ein-yaakov |
| Find a shiur | Ein Yaakov shiur, Ein Yaakov podcast, Ein Yaakov Kesuvos | home, /kesuvos |
| A specific daf | Kesuvos 17a aggadah, Kesuvos 8b, כתובות יז | each shiur page (daf in the title) |
| A specific story | how to dance before the kallah gemara, Rabban Gamliel linen shrouds, Rabbi Pinchas ben Yair donkey | story pages |
| A theme | gemara about marriage, sheva brachos meaning, give no more than a fifth tzedakah | topic pages |
| Practical | Ein Yaakov between mincha and maariv, Ein Yaakov for beginners | /faq |

Hebrew searches (עין יעקב, כתובות יז) are a real audience; the daf already appears in Hebrew on each page.

## Pages to build

1. **/ein-yaakov — What is Ein Yaakov.** The pillar page, from `docs/ein-yaakov-writeup.md` once
   the Rav has reviewed it. Direct answer in the first two sentences, then history, the Rebbeim of
   Lubavitch, and this shiur.
2. **/faq**, with FAQPage structured data. Short, direct answers, each linking deeper:
   - What is Ein Yaakov? Who compiled it, and when?
   - How is Ein Yaakov different from learning Gemara?
   - Why do people learn Ein Yaakov between Mincha and Maariv?
   - Is the shiur suitable for beginners? Do I need a sefer?
   - Which masechta is the shiur learning now?
   - How do I find the shiur on a specific daf?
   - How do I listen on Spotify or Apple Podcasts?
   - When and where is the shiur given live?
   - Can I dedicate a shiur?
3. **/about/rabbi-fogelman.** Bio and photo, with Person structured data. Answer engines weigh who is teaching.
4. **/kesuvos, upgraded into a masechta guide.** A short introduction to the aggados of Kesuvos, then
   a list of every story covered, each linking to its shiur and chapter time.
5. **Story pages** (`/stories/<name>`), the strongest AEO play. One page per well-known aggadah: where it is in
   the Gemara, the story in a few sentences, its lesson, and the shiur and minute where the Rav
   teaches it. Start with stories people already search for: how to dance before the kallah, Rabban
   Gamliel and burial in linen, the sheva brachos, Rabbi Pinchas ben Yair's donkey.
6. **Topic pages** (`/topics/<topic>`) once more masechtos are in: marriage and the chuppah, mourning and
   comforting mourners, tzedakah, Shabbos and Yom Tov.

## For every shiur page, from now on

- Title pattern: `<Masechta> <daf>: <topic> | Ein Yaakov with Rabbi Fogelman`, so daf searches match.
- Add **"Key ideas"** (3–5 bullets) and **"Sources discussed"** (the Gemara, Rashi, Maharsha and others
  the Rav cites) under the summary. This is the fix for thin pages, and it is drafted from the
  transcript the same way the summary is, then reviewed.
- Chapter titles stay as they are; they already read like the questions people search for.

## Technical work (one pass, then automatic)

- `robots.txt`, canonical URL and social preview image on every page.
- Structured data: PodcastSeries on the home page, with `sameAs` links to the Spotify and Apple pages;
  Person for the Rav; BreadcrumbList on masechta and shiur pages; FAQPage on /faq.
- Register in Google Search Console and Bing Webmaster Tools (DNS verification in Cloudflare) and submit the sitemap.
- Page analytics (Vercel Web Analytics) alongside download stats (OP3), to see which pages and
  searches bring people in.

## Off-site

- Links from the shul's website and newsletter, and from the Spotify and Apple show pages back to the site.
- Listings on Jewish learning platforms (TorahAnytime, 24Six) that link to the site.

## Order

1. Technical pass and search-engine registration.
2. /faq and /about/rabbi-fogelman.
3. /ein-yaakov, after the Rav's review.
4. Key ideas and sources on the existing Kesuvos shiurim, then on each new shiur.
5. The Kesuvos guide and the first four story pages.
6. Topic pages as the library grows.

## Ground rules

- Nothing about the Rebbeim, the Rav, or the Gemara goes up without a checked source.
- The Rav reviews new content pages before they go live.
- Write for the reader first: a direct answer, then the detail. That is also what answer engines quote.
