# Topic pages — spec (SHA-92)

Generated hub pages that collect the shiurim on one theme ("tzedakah in the Gemara", "marriage and
the chuppah"), built from the catalog's `key_ideas` and chapter titles. Everything on the page is
computed from `content/shiurim/` at build time, so the pages stay in sync with the weekly publish.

Why: `docs/SEO_PLAN.md` lists "a theme" as a search intent we cannot serve today — *gemara about
marriage*, *sheva brachos meaning*, *give no more than a fifth tzedakah* — and AI answer engines
favor pages that collect a question's answers with direct quotations. The Rav's `key_ideas` are
already one-sentence lessons in plain English; a topic page is where they become quotable as a set.

The machine-readable taxonomy is `content/topics.json`. The matching rule is prototyped in
`pipeline/topics_gen.py` and must be ported as-is to `lib/topics.ts` so the prototype and the site
can never disagree.

## 1. URL scheme

- `https://www.einyaakovshiur.com/topics` — the topic hub: every qualifying topic, one line each.
- `https://www.einyaakovshiur.com/topics/<slug>` — one topic page per qualifying topic.
- Slugs come from `content/topics.json` (lowercase, hyphenated, curated — never derived from a
  shiur's text). Changing a slug later is a page move: add a redirect from the old slug.
- Static generation: `generateStaticParams()` over qualifying topics. A topic that stops
  qualifying 404s on next build — acceptable because the catalog only grows, and every topic that
  ever qualified has ≥3 shiurim unless shiurim are unpublished.

## 2. Qualification rule

A **shiur matches a topic** when its match score ≥ the topic's `score_min` (default 2), where:

- `score = 2 × (key_ideas hits) + (chapter-title hits)`
- a hit is a case-insensitive, **word-boundary** keyword/phrase match over normalized text
  (same normalization family as `lib/search.ts norm()`: lowercase, strip niqqud/apostrophes/
  punctuation; see `pipeline/topics_gen.py`)
- a key-idea hit counts double because the Rav's four `key_ideas` are deliberate, reviewed
  statements of what the shiur teaches; a chapter title is a navigational hint.
- per-topic overrides in `content/topics.json`:
  - `"always": ["kesuvos/9", …]` — force a shiur to match regardless of score;
  - `"never": ["kesuvos/3", …]` — force a non-match (used when a single chapter is coincidental).

A **topic page is generated** only when ≥ **3 published shiurim** match. Min 3 (not 2) because a
2-shiur page is a thin collection: it adds crawl budget without looking like a real hub, and the
site is ~2 months old with little authority. There is no Search Console data to calibrate against
yet — the site is not registered with GSC (`docs/SEO_PLAN.md`) — so the threshold rests on
thin-content reasoning alone; revisit it once GSC shows real index coverage.

Curation is human: new topics are added to `content/topics.json` by hand (title, description,
keywords) and Greg reviews the generated match list before the topic ships. The generator never
invents topics from the text. Descriptions in `content/topics.json` are marked DRAFTED and must be
unmarked (and reworded if needed) as part of Greg's review — the page shows the `description`
field verbatim.

Tuning loop: run `python3 pipeline/topics_gen.py` after tuning; it prints each match with its
evidence (which key ideas and chapters hit), so every false positive is visible and fixable with
one keyword or a `never` entry.

**Keyword hygiene** (learned in QA round 1, 2026-11-26): bare common words match figurative or
unrelated uses and are banned as keywords — `give/gave/gives` matched "Rabbi Akiva **gave** his
last water" and "the soldiers **gave** gittin" under tzedakah; `heaven` matched "fear of **Heaven**"
and "zivug decreed in **Heaven**" under angels; bare `words` matched "**Words** of Torah are like a
goad" under guarding-speech; `first day` matched an egg laid on the "**first day**" of Rosh
Hashanah under creation. Use specific phrases instead (`salt of money`, `words never disappear`,
`every word`). Two traps the evidence print exposes: `norm()` strips apostrophes, so `heavens`
also matches *Heaven's* — plural `heavens` was tried and removed for exactly that reason; and
singular/plural pairs differ ("Every **word** is recounted" was missed by bare `words` and caught
only by the phrase `every word`). Any keyword change must be followed by a re-run whose output is
committed to `docs/topics_gen_output.txt`.

## 3. Page template (wireframe)

```
/topics/<slug>
┌──────────────────────────────────────────────────────────┐
│ Breadcrumb: Ein Yaakov > Topics > <Topic title>            │
│ H1: <title from topics.json>       (e.g. "Tzedakah and    │
│     chesed")                       … in the Gemara's      │
│                                     aggados" — final      │
│                                     wording per review)   │
│ Intro: <description field, 2–3 sentences, Greg-reviewed>  │
├──────────────────────────────────────────────────────────┤
│ "What the Rav teaches about <topic>"                      │
│ Bulleted key ideas: every matching key_idea, deduped,     │
│ each attributed and linked to its shiur (this is the AEO  │
│ block — quotable one-sentence lessons, not our paraphrase)│
├──────────────────────────────────────────────────────────┤
│ "Shiurim on this topic"  (matched, sorted by score desc) │
│ Shiur card (reuse the existing card component):           │
│   title · Masechta Daf-range · given_on · link           │
│   + the matching key_ideas/chapter titles as inline text  │
│     (why this shiur is listed — keeps each entry unique)  │
├──────────────────────────────────────────────────────────┤
│ "Related topics": topics sharing ≥2 matching shiurim      │
│ CTA: "New shiur every week" (reuse existing footer CTA)   │
└──────────────────────────────────────────────────────────┘
```

- Server-rendered, static, same design system as the library (Figtree, cover blue, gold accents).
- No per-topic OG image at launch — reuse the site-level `opengraph-image.tsx` default; per-topic
  images are a later enhancement.
- Metadata: `title` = "<Topic title> — Ein Yaakov with Rabbi Chaim Fogelman"; `description` =
  `description` field; canonical self; `openGraph` from the same fields.

## 4. Schema (JSON-LD)

Per topic page, one graph:

- **`CollectionPage`** — `@id` `{SITE.url}/topics/<slug>#page`, `name`, `description`,
  `isPartOf` site, `about` the topic as a `Thing` with `alternateName` = `aliases[]`, plus
  `BreadcrumbList` (home → topics → topic).
- **`ItemList`** as `mainEntity` of the CollectionPage — the matching shiurim in score order,
  each entry a link to the existing shiur page (whose own PodcastEpisode stays canonical for the
  episode).

No new entity types. CollectionPage + ItemList is what Google's documentation shows for curated
collections and what AI crawlers parse cleanly; the Rav's `key_ideas` text on the page is the AEO
payload — schema just ties it to entities.

## 5. Internal linking

- **Shiur pages** gain a "Topics in this shiur" line: one link to each qualifying topic the shiur
  matches (max all — most shiurim match 1–3 topics). This is the main crawl path and keeps every
  topic page linked from real content.
- **Library/home** gains a "Browse by topic" strip on `/` and a topics link in the footer nav.
- **Masechta hubs** stay unchanged (topic pages cross masechtos by design; that is their point).
- **Topic pages** link to every matching shiur and to related topics (rule: ≥2 shared shiurim).

## 6. Sitemap and llms.txt

- `app/sitemap.ts`: add `/topics` (lastmod = newest `given_on` among all qualifying topics' shiurim)
  and one row per qualifying topic page, `lastmod` = newest `given_on` of its matching shiurim —
  a new shiur that matches the topic naturally bumps it.
- `app/llms.txt/route.ts`: add a `## Browse by topic` section between the masechta sections and
  Site pages — one line per topic: `- [<Title>](url): <description> (N shiurim, list of daf
  ranges)`. This is the AEO surface: AI engines reading llms.txt get the topic map with counts.

## 7. Implementation notes

- `lib/topics.ts`: port `pipeline/topics_gen.py`'s `norm()`, `hit()` and `match_shiur()` with the
  same constants (`MIN_SHIURIM = 3`, `DEFAULT_SCORE_MIN = 2`); export `topics()` (qualifying, in
  `content/topics.json` order) and `matchesFor(topic)` used by both routes and the shiur page's
  "Topics in this shiur" line.
- `app/topics/page.tsx` (hub) and `app/topics/[topic]/page.tsx`; `notFound()` for non-qualifying
  slugs (so a de-qualified page drops out rather than rendering stale).
- Dedupe rule for the key-ideas block: identical key_idea text appearing on multiple shiurim
  collapses to one bullet linking the first (highest-score) shiur.
- QA gate: after build, assert every sitemap topic URL renders H1 + ≥3 shiur cards + schema.

## 8. The generated topic list (real catalog, 2026-11-26, after QA-round-1 keyword tightening)

27 published shiurim. Output of `python3 pipeline/topics_gen.py`, committed verbatim at
`docs/topics_gen_output.txt`:

**11 pages qualify (≥3 matching shiurim):**

| URL | Topic | Shiurim | Top match |
| --- | --- | --- | --- |
| /topics/torah-learning | The value of learning Torah | 11 | Kesuvos 8 (score 12) |
| /topics/guarding-speech | Guarding the eyes and the tongue | 7 | Chagigah 4 (score 4) |
| /topics/shabbos-yom-tov | Shabbos and Yom Tov | 7 | Baitza 1 (score 17) |
| /topics/tzaddikim | The tzaddik and his power | 7 | Baitza 4 (score 3) |
| /topics/marriage | Marriage, the chuppah and the Jewish home | 6 | Kesuvos 1 (score 17) |
| /topics/creation | The creation and the hidden light | 5 | Chagigah 7 (score 8) |
| /topics/gehinnom | Gehinnom and the judgment | 5 | Eruvin 2 (score 7) |
| /topics/korbanos | Korbanos and the Beis Hamikdash | 4 | Chagigah 6 (score 9) |
| /topics/tzedakah | Tzedakah and chesed | 4 | Kesuvos 6 (score 12) |
| /topics/angels | Angels, the heavens and the Merkavah | 3 | Chagigah 9 (score 5) |
| /topics/emunah | Emunah, bitachon and parnassah | 3 | Baitza 1 (score 7) |

**3 topics wait below threshold (2 each) — page appears automatically when the third shiur
matches:** teshuvah, mourning, davening.

**Changes from the pre-QA run (same catalog, same rule — only keywords in
`content/topics.json` changed; see the keyword-hygiene note in §2):**

- *tzedakah* 9 → 4. Dropped as false positives (bare `give/gave/gives`): eruvin/2 ("Rabbi Akiva
  **gave** his last water"), eruvin/3 ("Shlomo **gave** the Torah handles"), kesuvos/2 ("one who
  **gives** should never look…"), kesuvos/3 ("soldiers **gave** gittin"), baitza/2 ("one who
  **gives** a gift"). Remaining: kesuvos 5, 6, 9 — the core the taxonomy notes predicted — plus
  **chagigah/8, a known borderline kept match** (via `chesed`: "One who learns Torah at night is
  granted chesed by day", "Chesed or rachamim first?"). If Greg calls it off-topic, remove
  `chesed` from the match list; tzedakah then still qualifies with its 3 core shiurim.
- *angels* 5 → 3. Dropped as false positives (any `heaven`): eruvin/2 ("fear of **Heaven**"),
  kesuvos/1 ("zivug decreed in **Heaven**") — Heaven meaning Hashem — and kesuvos/5 ("Everything is
  in **Heaven's** hands", which plural `heavens` caught because `norm()` strips the apostrophe).
  Remaining: chagigah 3, 9, 10 — exactly the malachim/merkavah shiurim.
- *guarding-speech* 8 → 7. Dropped as false positives (bare `words`): chagigah/2 ("**Words** of
  Torah are like a goad") and kesuvos/7 ("The power of a tzaddik's **words**" — about the power of
  speech, not guarding it). Gained a true positive the bare keyword had missed: chagigah/4
  ("Every **word** a person says, even in private, is recounted before him" — singular `word`),
  now the top match. Remaining: chagigah 4, 7; kesuvos 1, 3, 5; eruvin 1, 2.
- *creation* 6 → 5. Dropped as a false positive (`first day`): baitza/1 ("an egg laid on the
  **first day**" of Rosh Hashanah). The true `first day` content (chagigah/7 "Ten things created
  on the first day") still matches via `created`.
- *torah-learning* `learn`/`learning` were reviewed (QA flagged them as loose): the two lowest
  matches — baitza/5 ("those who work by day and **learn** every night") and kesuvos/5 ("fill him
  with **learning**") — are genuinely about learning Torah, so the keywords stay; no change
  (11 shiurim).
- All 11 topics still clear the ≥3 bar after the cleanup; the tightest are *angels* and *emunah*
  at exactly 3.

Examples of matches the evidence shows (so reviewers can judge quality):
- *tzedakah*: kesuvos/6 (12) and kesuvos/9 (11) lead — all four Kesuvos 9 key ideas hit except
  "Hashem **gives** each person his food in its time", which lost `gives`; see emunah below.
- *marriage*: Kesuvos 1 (17), 4 (8), 8 (6), 2 (4), 3 (3), 7 (2) — the exact set the taxonomy
  notes predicted; the score_min=2 rule correctly kept the tzedakah shiurim's isolated marriage
  chapters out.
- *emunah*: only 3 shiurim. Kesuvos 9's "Hashem gives each person his food in its time" does not
  hit today's keywords — adding `"food in its time"` / `"worry"` to `match` in
  `content/topics.json` as part of review would both firm up emunah (4 shiurim) and restore a
  genuine tzedakah key idea on kesuvos/9.

## 9. Impact / effort / targets

- **Impact: high.** Serves the theme-search intent in `docs/SEO_PLAN.md` and gives AI engines a
  per-topic quotable block. **Effort: medium** — one lib port, two routes, sitemap/llms.txt
  additions; the taxonomy and prototype already exist.
- Measurable targets (GSC, 90 days after launch): impressions on the topic queries in
  SEO_PLAN.md (baseline today: zero, no page serves them); ≥1 topic page in the top 20 for
  "tzedakah gemara"/"gemara about marriage" queries; at least one topic page cited in an AI
  answer (check ChatGPT/Perplexity for the 11 slugs monthly).
- Launch order: ship tzedakah, marriage, torah-learning first (strongest evidence), the rest in
  the same PR if QA is green.

## 10. Open for Greg's review

1. Un-DRAFT the 11 `description` fields (wording is his).
2. Tzedakah's borderline match chagigah/8 (via `chesed` — see §8): keep, or drop `chesed` from the
   match list (tzedakah still qualifies with kesuvos 5, 6, 9). The pre-QA baitza/2 "gift" edge no
   longer matches after the keyword tightening.
3. Candidate topics intentionally not in the taxonomy yet: *Rabbi Akiva* (4 shiurim would match),
   *Hillel and Shammai* (4), *stories of the Gemara* (12, but overlaps everything — better as an
   /stories landing page later, not a topic page), *chassidic insights on the aggadah* (13 — same
   overlap concern). Add only if he wants them.
4. `MIN_SHIURIM` stays 3 as the catalog grows; revisit at 100+ shiurim.
5. emunah keyword addition (`"food in its time"` / `"worry"`, §8) — his call whether to make it
   with this PR or after launch.
