# Shiur site — design notes (round 1)

`prototype.html` is a clickable, mobile-first prototype of the shiur site. It runs on
**sample data**: the masechtos, topics, dates and transcripts are placeholders, and audio
is simulated. Open it in a browser; no build step.

## What it covers

Routes from `HANDOFF.md`, mapped to prototype views (hash routes stand in for real paths):

| Real route | Prototype | Notes |
| --- | --- | --- |
| `/` | `#home` | Latest shiur, search box with masechta chips, masechtos grouped by seder, subscribe links |
| `/<masechta>` | `#m-kesuvos` | All shiurim with number, daf range, date, length; sort by daf or newest; "Go to daf" |
| `/<masechta>/<number>` | `#s-kesuvos-5` | Player, speed, chapters (click to jump), summary, transcript, prev/next |
| `/search?q=` | `#search` | Full-text over title, summary, transcript; filter by masechta |
| `/daf/<masechta>/<daf>` | "Go to daf" box, or typing `Kesuvos 17a` in search | Lands on the shiur covering that daf, or names the closest one |
| `/about` | `#about` | Placeholder copy |

## Design decisions to review

1. **Masechta is the primary way in.** The home page lists masechtos grouped by seder, and
   search has one-tap masechta filter chips.
2. **Search understands masechta + daf.** `Kesuvos 17a`, `Ketubot 62b` and `kesubos 104`
   all resolve to the right shiur. Sephardi and Ashkenazi spellings are aliases, since
   listeners will type both. This needs an `aliases` column (or table) on `masechtos`.
3. **Daf shown in both notations**: `104a` in lists, `כתובות ק״ד ע״א` on the shiur page.
4. **Persistent mini-player** docked at the bottom, so a listener can browse while a
   shiur plays. Speed control (1×–2×) is on both players.
5. **Transcript open by default** on the shiur page, which also serves SEO. On very
   long transcripts we may want it collapsed on mobile.

## Data model implications

- `masechtos` needs `seder` (for grouping) and spelling `aliases` (for search).
- Daf-range lookup needs `daf_start` / `daf_end` to be comparable; store a numeric
  index (`daf * 2 + amud`) alongside the text, or parse on query.

## Open questions for Greg / the rav

- Show name (the prototype uses "Ein Yaakov Shiur") and the rav's name on the About page
- Should the masechta list also show masechtos not yet covered (greyed out)?
- Hebrew dates alongside secular dates?
- Keep "Questions from the audience" as a named chapter, given the open decision on audience voices?
