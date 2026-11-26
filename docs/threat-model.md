# Threat model: einyaakovshiur.com

Updated November 26, 2026. This replaces an earlier automated review, which described the system from `HANDOFF.md`'s original plan (Supabase, an admin review queue, an automatic Dropbox pipeline). None of that was built. This version describes what actually runs.

## The system in one paragraph

A Next.js 16 site on Vercel publishes Rabbi Chaim Fogelman's Ein Yaakov shiurim as a library and a podcast feed. All content is JSON in the repo; there is no database, no login, no admin screen and no form that writes anything. Audio lives in Cloudflare R2 behind `audio.einyaakovshiur.com`. Every push to the `claude/determined-clarke-bi0vun` branch deploys straight to production.

## What actually matters

The website code has very little attack surface: it only reads. The realistic ways to damage the shiur are:

1. **Taking over an account that controls publishing.**
2. **Pushing a bad change to the branch,** which goes live with no second review.
3. **Replacing or deleting audio in R2.**

Most of the work is therefore account and settings hygiene, not code.

### 1. Accounts (highest risk)

Anyone who controls one of these can change what listeners get:

| Account | What a takeover allows |
| --- | --- |
| GitHub (CHREGGIE) | Push any change to the live site |
| Vercel | Change deployments, environment variables, domains |
| Cloudflare | Replace or delete audio in R2; repoint DNS for the whole domain |
| Domain registrar | Move the domain away entirely |
| greg@sharpcom.net email | Reset the other accounts; this address is the podcast owner in the feed, which Spotify and Apple use to verify ownership |
| Spotify for Creators, Apple Podcasts Connect | Change or take down the show listings |
| YouTube, Google Search Console | Change the channel; affect how Google shows the site |

**Control:** two-factor sign-in on every one, preferably an authenticator app or security key rather than SMS. Status: to be confirmed by Greg (checklist below).

### 2. The publishing path

- **Push equals live.** A mistaken or malicious commit reaches visitors and podcast apps within about two minutes.
- **The review step is Greg's.** Greg reads the write-up and confirms the MP3 is in R2 before Claude publishes. That review covers the content (titles, summaries, sources), not the code diff.
- **Mitigations:**
  - Vercel keeps every past deployment, so a bad one can be rolled back from the dashboard in seconds.
  - GitHub branch protection should block force-pushes and deletion of the deploy branch, so history can't be rewritten or erased (checklist below).
- **The podcast feed is trusted automatically by every app.** A bad change to `feed.xml` spreads to all subscribers. Episode GUIDs must never change once published (see the skill file), or apps show duplicate episodes.

### 3. Audio in R2

- The site only links to R2; it never writes there.
- R2 should allow public reads but no public writes. Any API tokens should be limited to the one bucket, and revoked when not in use.
- File names are predictable (`kesuvos/Kesuvos-09.mp3`). That is fine: the audio is public on purpose.
- **Backups.** The cleaned MP3s exist in R2 and in Claude's temporary workspace, which can be wiped. The Dropbox originals are the uncleaned versions. Keep a second copy of the cleaned files somewhere Greg controls.

### 4. Inputs that come from outside

| Input | Where it goes | Trust |
| --- | --- | --- |
| Recordings Greg sends | Transcribed; Claude writes the page from them | Treated as data. A recording can't instruct the pipeline; Claude writes the summary, and Greg sees it before it publishes. |
| Automatic transcripts | Shown on every shiur page and used by search | Published as is, by Greg's decision, under a note that Hebrew and Aramaic may be misspelled. They can contain personal remarks (for example, the Rav mentioning his father's yahrzeit). Hide one with `"transcript_public": false` in its meta file. |
| Search box `?q=` | Matched against the catalog; shown back on the page | Untrusted; handled safely (below). |
| URL path (`/kesuvos/9`, `/daf/kesuvos/62b`) | Picks a page | Untrusted; handled safely (below). |
| `content/transcript-fixes.json` keys | Turned into a pattern at build time | Trusted (only edited in the repo). |

## Website code: checked and fine

These were verified in the code, November 26:

- **Search** (`app/search/page.tsx`): the query is cut to 200 characters and only ever shown as plain text, which React escapes. No raw HTML.
- **Daf links** (`app/daf/[masechta]/[daf]/route.ts`): redirects only ever go to a page built from the catalog's own names and numbers, or to the home page. Never to an address someone typed in.
- **Shiur and masechta pages:** only published shiurim exist. Any other address returns "not found."
- **Structured data** (`components/JsonLd.tsx`): `<` is escaped, so text in a title can't break out of the script tag.
- **Feed** (`app/feed.xml/route.ts`): titles and descriptions are XML-escaped. The GUID, numbers and audio URL come from the catalog only.
- **Player** (`components/Player.tsx`): the `#t=` link only accepts digits; listening progress stays in the visitor's own browser.
- **Social images and the feed** are built once at deploy time, so visitors can't trigger expensive work.
- **Dependencies:** `npm audit` is clean after the Next.js 16.4.5 upgrade (November 18).

## Hardening added November 26

`next.config.ts` now sends these headers on every response:

| Header | Purpose |
| --- | --- |
| `X-Content-Type-Options: nosniff` | Browsers don't guess file types |
| `Referrer-Policy: strict-origin-when-cross-origin` | Other sites don't see full page addresses |
| `X-Frame-Options: DENY` (and CSP `frame-ancestors 'none'`) | No other site can frame ours |
| `Permissions-Policy` | Camera, microphone, location and similar are off |
| `Content-Security-Policy-Report-Only` | Lists the only allowed sources: the site itself, Google Fonts, and the audio host |

**Plan for the content security policy:**
- It's in report-only mode, so it logs instead of blocking.
- Testing on November 26 found no violations on the home, masechta, shiur, search, FAQ and dedication pages, with audio playing.
- After a few weeks without problems, rename the header to `Content-Security-Policy` to enforce it, and add `upgrade-insecure-requests`.
- `script-src` allows inline scripts because Next.js needs them. Moving to nonces would remove that, at the cost of making every page dynamic. Not worth it for a read-only site.

## Checklist for Greg

**Accounts**
- [ ] **Two-factor sign-in** (authenticator app or security key) on: GitHub, Vercel, Cloudflare, the domain registrar, the greg@sharpcom.net email, Spotify for Creators, Apple Podcasts Connect, YouTube and Google Search Console.
- [ ] **Recovery codes:** save each account's recovery codes somewhere offline.

**GitHub settings**
- [ ] **Branch protection.** In GitHub, open the repo, then **Settings → Branches → Add branch ruleset** (or "Add rule") for `claude/determined-clarke-bi0vun`. Turn on "Block force pushes" and "Restrict deletions". Leave required reviews off, so weekly publishing stays fast.
- [ ] **Dependabot alerts.** In GitHub, open the repo, then **Settings → Code security** and turn on Dependabot alerts.

**Cloudflare and audio**
- [ ] **R2 bucket access.** In Cloudflare, go to **R2 → the bucket → Settings**. Confirm public access is read-only through the custom domain, and review **R2 → Manage API tokens**. Delete any token you don't use, and limit the rest to this bucket.
- [ ] **Backups.** Keep a copy of the cleaned MP3s, for example a Dropbox folder of cleaned files next to the originals.

**Vercel**
- [ ] **Team members.** Confirm only you are on the Vercel team. Remove anyone else.

## Not in scope

The `pipeline/` scripts and `design/` files run locally or are reference only; neither is served by the site. Vercel and Cloudflare platform security are theirs to maintain.
