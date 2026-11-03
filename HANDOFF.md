# Shiur Podcast — Technical Handoff for Claude Code

Oct 28, 2026 · @Gregory · Updated Oct 30, 2026 (weekly podcast + library model, design prototype)

Companion to Doc. Export this doc as Markdown and save it in the repo as `CLAUDE.md` or `HANDOFF.md`.

## Read this first

You're building a pipeline and a standalone site that publish Rabbi Fogelman's weekly Ein Yaakov shiur from our shul as a searchable library and a weekly podcast feed. Greg Grinman owns the project and reviews everything before it goes public.

Already decided:

- **One catalog is the source of truth.** The shiur site and the RSS feed both read from it. No podcast-host service.
- **The shiur site is standalone**, separate from the shul's website.
- **Intake is Dropbox**, one folder per masechta, files named `Masechta-NN`.
- **Audio cleanup runs locally with ffmpeg** (`clean.sh` below), not Auphonic, unless spot checks show older recordings need more.
- **Nothing publishes without human review.**
- **Two products from one catalog: a weekly podcast and a library.** The podcast carries new shiurim, one a week, from the feed launch onward. The site library carries every reviewed shiur, including the backlog. Backlog shiurim keep their original dates and go into the library one masechta at a time; they do not go into the main podcast feed.
- **The weekly shiur always comes first in review.** Backlog review happens in batches and never holds up the weekly release.

Proposed but not locked: Supabase, Cloudflare R2, Whisper, Vercel. Confirm with Greg before building on them.

## Current state

Only the audio preset exists; no repo, database, storage or site has been set up.

| Date | Item | Status |
| --- | --- | --- |
| 2026-10-28 | `clean.sh` tested on `Kesuvos_05.m4a` (51 min) | Done; awaiting Greg's listening approval |
| 2026-10-28 | A/B comparison clip produced | Done |
| 2026-10-28 | Workflow diagram shown to stakeholders | Done |
| 2026-10-30 | Site design prototype (`design/prototype.html`) | Round 3 done: weekly + library homepage |
| 2026-10-30 | Weekly podcast + library model agreed | Done; this doc updated |
| 2026-11-03 | Baitza 1–4 received, inventoried and cleaned (`pipeline/inventory/baitza.csv`) | Done; awaiting listening review, shiur dates unknown |
| 2026-11-03 | `pipeline/clean.sh` moved to two-pass loudnorm, limiter at -3 dBFS | Done; all four Baitza files pass -16 ±1 LUFS and ≤ -1 dBTP |
| — | Backlog inventory (5 masechtos) | Started with Baitza; rest not received |
| — | Repo, catalog, storage, site, feed | Not started |

## Two ways to listen

Listeners and learners use the shiur in two ways, and both come from the same catalog.

| | Weekly podcast | Site library |
| --- | --- | --- |
| For | People following the shiur week by week | People learning at their own pace, by masechta, or something other than the current masechta |
| Contains | Shiurim given on or after the feed launch date, plus any flagged `in_feed` | Every reviewed shiur, backlog included |
| Where | Apple Podcasts, Spotify and other apps via `/feed.xml` | The shiur site |
| Cadence | One new shiur a week | Backlog added a masechta at a time as review finishes |

Launch the feed with the three or four most recent shiurim already in it so it doesn't look empty in the directories. Per-masechta feeds (e.g. "Ein Yaakov on Kesuvos") are a likely later addition for library learners who listen in a podcast app; they are cheap because every feed is generated from the catalog.

## Conventions and specs

Every output file must meet these specs so the site and every podcast app behave the same way.

| Item | Spec |
| --- | --- |
| Source file name | `Masechta-NN.ext`, e.g. `Kesuvos-05.m4a` (masechta in Ashkenazi transliteration as used in the folders) |
| Dropbox layout | One folder per masechta |
| Published audio | MP3, mono, 44.1 kHz, 64 kbps CBR |
| Loudness | -16 LUFS integrated (±1 LU), true peak ≤ -1 dBTP |
| Episode title | `Ein Yaakov on <Masechta> – Shiur <N>: <topic>` |
| Publish date | The date the shiur was given, never the upload date |
| Season / episode | Season = masechta, episode = shiur number within it |
| Status flow | raw → cleaned → transcribed → drafted → reviewed → published |
| Published means | Visible in the site library. It is in the podcast feed only if `given_on` ≥ feed launch date or `in_feed` is true |

The title format is a working default; Greg may change it after the rav weighs in.

## Audio cleanup script

This is the preset as tested on Kesuvos-05: it brought the file to -17.1 LUFS with a -0.8 dBFS peak.

```bash
#!/bin/bash
# Usage: ./clean.sh input.m4a output.mp3
set -e
IN="$1"; OUT="$2"
PRE="highpass=f=80:poles=2,equalizer=f=60:t=q:w=8:g=-8,equalizer=f=120:t=q:w=8:g=-8,afftdn=nr=10:nf=-50:tn=1"
POST="loudnorm=I=-16:TP=-2:LRA=11,alimiter=limit=0.79:level=disabled,aresample=44100"
ffmpeg -hide_banner -nostats -loglevel error -y -i "$IN" -af "$PRE,$POST" -ac 1 -c:a libmp3lame -b:a 64k "$OUT"
```

What each stage targets, from measurements of the source:

- `highpass` at 80 Hz removes room rumble (noise concentrated at 80–200 Hz)
- Two notches at 60 and 120 Hz cut mild mains hum (peaks 4.8 and 3.7 dB above neighbors)
- `afftdn` at `nr=10` is deliberately gentle so audience questions survive; source noise floor sits about 30 dB under speech
- `loudnorm` + `alimiter` hit podcast loudness without overs (source peaked at +0.5 dBFS)

Done (2026-11-03): `pipeline/clean.sh` is now two-pass (measure, then linear `loudnorm`), and `pipeline/measure.sh` checks each output with `ebur128`. The single-pass limiter at 0.79 let one Baitza file reach -0.7 dBTP after MP3 encoding, so the limiter is now 0.708 (-3 dBFS). Outputs land around -17 LUFS, inside the ±1 LU window.

Source recordings seen so far peak above 0 dBTP (Baitza: +0.0 to +1.9), so the limiter is required, not optional.

Intake notes from Baitza: files arrive as `Masechta_NN` (underscore), a shiur can be split into parts (`Baitza_04.1`, `Baitza_04.2`) that must be joined in order before cleaning, and file metadata dates are copy/export times, not shiur dates. The inventory script must flag all three.

## Proposed data model

Two tables cover the catalog: one row per masechta, one row per shiur. This is a starting proposal; adjust it when the inventory shows what metadata actually exists.

```sql
create type shiur_status as enum
  ('raw','cleaned','transcribed','drafted','reviewed','published');

create table masechtos (
  id            serial primary key,
  slug          text unique not null,      -- 'kesuvos'
  name          text not null,             -- 'Kesuvos'
  name_he       text,                      -- Hebrew name
  seder         text not null,             -- 'nashim', for grouping on the site
  aliases       text[] not null default '{}', -- other spellings for search: {'ketubot','kesubos'}
  season        int unique not null,       -- podcast season number
  description   text
);

create table settings (
  feed_launch_date date not null           -- shiurim given on or after this go in the weekly feed
);

create table shiurim (
  id             uuid primary key default gen_random_uuid(),
  guid           uuid unique not null default gen_random_uuid(), -- RSS guid, never changes
  masechta_id    int not null references masechtos(id),
  number         int not null,             -- shiur number within masechta
  source_file    text not null,            -- 'Kesuvos-05.m4a'
  given_on       date not null,            -- original shiur date = pubDate
  title          text,
  daf_start      text,                     -- e.g. '17a'
  daf_end        text,
  daf_start_idx  int,                      -- daf*2 + (amud b ? 1 : 0), for "which shiur covers 17a"
  daf_end_idx    int,
  in_feed        boolean not null default false, -- force a shiur into the weekly feed (e.g. launch seeding)
  summary        text,
  chapters       jsonb,                    -- [{start_sec, title}]
  transcript     text,
  audio_url      text,                     -- public MP3 URL
  audio_bytes    bigint,                   -- RSS enclosure length
  duration_sec   int,
  status         shiur_status not null default 'raw',
  published_at   timestamptz,
  search         tsvector generated always as
                 (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(transcript,''))) stored,
  unique (masechta_id, number)
);

create index shiurim_search_idx on shiurim using gin (search);
```

The `guid` must never change once published, or podcast apps will treat the shiur as a new episode.

## Build tasks

Build in this order; each task is done when its check passes.

- [ ] **Inventory script.** Walk the Dropbox folders and write one row per file (filename, masechta, number, date from metadata, duration). Done when every file appears once and misnamed files are flagged, not skipped.
- [ ] **Catalog setup.** Create the tables above and seed `masechtos`. Done when inventory rows load into `shiurim` with status `raw`.
- [ ] **Cleanup step.** Run `clean.sh` per file, upload the MP3 to storage, record URL, bytes and duration. Done when output measures -16 ±1 LUFS and peaks ≤ -1 dBTP.
- [ ] **Transcription step.** Whisper with an initial prompt of expected vocabulary (Ein Yaakov, Gemara, Rashi, Maharsha, masechta names). Done when a transcript is stored and timestamps exist for chapters.
- [ ] **Metadata drafts.** Claude drafts title, daf range, summary and chapters from the transcript. Done when drafts are stored with status `drafted`, never `published`.
- [ ] **Review queue.** A simple admin view to edit drafts and approve. Done when approving sets `reviewed` and nothing unreviewed can publish.
- [ ] **RSS feed.** Generated from `published` rows (spec below). Done when it passes a feed validator.
- [ ] **Shiur site.** Pages and search (spec below). Done when every published shiur is reachable by masechta, daf and search.
- [ ] **Batch runner.** Processes one masechta in batches of about 10, resumable after failure. Done when re-running skips completed files.
- [ ] **Weekly flow.** New file in Dropbox triggers the same pipeline up to review. Done when a test file reaches the review queue untouched by hand.

## RSS feed requirements

The feed is a static XML file regenerated whenever a shiur is published; the directories pull it on their own schedule.

- **Channel:** title, description, language `en`, author, owner name and email, explicit `false`, category Religion & Spirituality → Judaism, 3000×3000 cover art, link to the shiur site
- **Per item:** title, description (summary + link to the shiur page), `enclosure` with MP3 URL, byte length and `audio/mpeg`, `guid` from the catalog (`isPermaLink="false"`), `pubDate` from `given_on`, duration, season = masechta, episode = shiur number, chapters if supported
- **Which items:** published shiurim with `given_on` ≥ `feed_launch_date`, or `in_feed = true`. Backlog shiurim stay out of the main feed
- **Order:** newest first
- **Stats:** prefix enclosure URLs with OP3 for download counts
- **Scheduling:** if the rav asks for it, never set a publish time that falls on Shabbos or Yom Tov

Verify Apple's and Spotify's current tag requirements when building; don't rely on this list alone.

## Shiur site requirements

The site is a library modeled on YUTorah, scoped to this one shiur, reading only `published` rows from the catalog.

| Route | Content |
| --- | --- |
| `/` | Two paths: **This week** (now-learning masechta, latest shiur with player, subscribe links per app) and **The library** (masechta tabs, search, stats) |
| `/<masechta>` | All shiurim in order: number, date, daf range, length; "Start from shiur 1" / "Continue shiur N"; go-to-daf box |
| `/<masechta>/<number>` | Player, download, summary, chapters, full transcript, previous/next |
| `/search?q=` | Full-text search over title, summary and transcript |
| `/daf/<masechta>/<daf>` | Redirect to the shiur covering that daf |
| `/about` | The rav, time and place, dedications |
| `/feed.xml` | The RSS feed |

Other requirements:

- Each shiur page is server-rendered with its title, summary and chapters. Transcripts are not shown (decided 2026-11-03): automatic transcription garbles the Hebrew, Aramaic and Yiddish. They stay in the catalog files and feed search only. Revisit if a better transcription method is found
- Structured data (`PodcastEpisode`) on each shiur page
- Mobile-first; most listeners will open it on a phone
- Search accepts masechta + daf (`Kesuvos 17a`) and both Ashkenazi and Sephardi spellings, via `masechtos.aliases`
- Shiurim that are also in the podcast are tagged as such in the library
- Remember each listener's place per masechta in the browser (no accounts) so "Continue" works
- A docked player persists across pages, with 1×–2× speed and −15/+30 skips
- `design/prototype.html` is the reference for layout and behavior; `design/NOTES.md` has the reasoning
- Hebrew terms display correctly; any Hebrew text renders right-to-left

Framework is open; Next.js or Astro on Vercel both fit.

## Open decisions

Ask Greg about each of these instead of guessing; several depend on the rav.

- [ ] Show name, intro wording, and the shiur site's domain
- [ ] Shul name, and the shiur's day, time and place for the About page
- [ ] Feed launch date, and which recent shiurim to seed it with
- [ ] How dedications work: price, payment, who approves wording
- [ ] Whether to add per-masechta feeds, and when
- [ ] How audience questions are handled: keep, trim, or remove identifiable voices
- [ ] Whether publishing must avoid Shabbos and Yom Tov
- [ ] Who reviews: Greg, the rav, or a volunteer
- [ ] Final stack: confirm Supabase, R2, Whisper (local or API) and the site framework
- [ ] Backlog size and naming consistency, known only after the inventory
- [ ] Whether older recordings need a different cleanup preset

Until the rav approves, keep everything private: no public feed, no indexed site.
