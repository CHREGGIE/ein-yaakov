# Shiur Podcast — Technical Handoff for Claude Code

Oct 28, 2026 · @Gregory

Companion to Doc. Export this doc as Markdown and save it in the repo as `CLAUDE.md` or `HANDOFF.md`.

## Read this first

You're building a pipeline and a standalone site that publish a rabbi's weekly Ein Yaakov shiur as a searchable library and a podcast feed. Greg Grinman owns the project and reviews everything before it goes public.

Already decided:

- **One catalog is the source of truth.** The shiur site and the RSS feed both read from it. No podcast-host service.
- **The shiur site is standalone**, separate from the shul's website.
- **Intake is Dropbox**, one folder per masechta, files named `Masechta-NN`.
- **Audio cleanup runs locally with ffmpeg** (`clean.sh` below), not Auphonic, unless spot checks show older recordings need more.
- **Nothing publishes without human review.**
- **Backfill publishes with original shiur dates**, one masechta at a time.

Proposed but not locked: Supabase, Cloudflare R2, Whisper, Vercel. Confirm with Greg before building on them.

## Current state

Only the audio preset exists; no repo, database, storage or site has been set up.

| Date | Item | Status |
| --- | --- | --- |
| 2026-10-28 | `clean.sh` tested on `Kesuvos_05.m4a` (51 min) | Done; awaiting Greg's listening approval |
| 2026-10-28 | A/B comparison clip produced | Done |
| 2026-10-28 | Workflow diagram shown to stakeholders | Done |
| — | Backlog inventory (5 masechtos) | Not started; file count unknown |
| — | Repo, catalog, storage, site, feed | Not started |

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

To do: add a two-pass `loudnorm` to land closer to -16 LUFS, and verify each output with `ebur128` before marking it cleaned.

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
  season        int unique not null,       -- podcast season number
  description   text
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
- **Order:** all published items, newest first
- **Stats:** prefix enclosure URLs with OP3 for download counts
- **Scheduling:** if the rav asks for it, never set a publish time that falls on Shabbos or Yom Tov

Verify Apple's and Spotify's current tag requirements when building; don't rely on this list alone.

## Shiur site requirements

The site is a library modeled on YUTorah, scoped to this one shiur, reading only `published` rows from the catalog.

| Route | Content |
| --- | --- |
| `/` | Latest shiur with player, masechta list, search box, subscribe links per app |
| `/<masechta>` | All shiurim in order: number, date, daf range, length |
| `/<masechta>/<number>` | Player, download, summary, chapters, full transcript, previous/next |
| `/search?q=` | Full-text search over title, summary and transcript |
| `/daf/<masechta>/<daf>` | Redirect to the shiur covering that daf |
| `/about` | The rav, time and place, dedications |
| `/feed.xml` | The RSS feed |

Other requirements:

- Each shiur page is server-rendered with the transcript in the HTML, so it can be indexed by search engines
- Structured data (`PodcastEpisode`) on each shiur page
- Mobile-first; most listeners will open it on a phone
- Hebrew terms display correctly; any Hebrew text renders right-to-left

Framework is open; Next.js or Astro on Vercel both fit.

## Open decisions

Ask Greg about each of these instead of guessing; several depend on the rav.

- [ ] Show name, intro wording, and the shiur site's domain
- [ ] How audience questions are handled: keep, trim, or remove identifiable voices
- [ ] Whether publishing must avoid Shabbos and Yom Tov
- [ ] Who reviews: Greg, the rav, or a volunteer
- [ ] Final stack: confirm Supabase, R2, Whisper (local or API) and the site framework
- [ ] Backlog size and naming consistency, known only after the inventory
- [ ] Whether older recordings need a different cleanup preset

Until the rav approves, keep everything private: no public feed, no indexed site.
