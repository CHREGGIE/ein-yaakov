---
name: ein-yaakov-show
description: The weekly Ein Yaakov production run for Rabbi Chaim Fogelman's shiur. Use it whenever Greg sends a new recording (an attachment or Dropbox link), says a recording is in R2, or asks to publish, release, backfill, write titles or summaries, cut clips, make a WhatsApp Status, YouTube Short (with its title and description) or Reel, or create branded art for any platform. It covers ingest, audio cleanup, transcription, writing the shiur page, publishing to the site and podcast feed, choosing and building clips, and the brand rules.
---

# Ein Yaakov show: the weekly run

Rabbi Chaim Fogelman gives an Ein Yaakov shiur **Tuesday nights at 8pm at the Itchkes Shtiebel**. Greg (greg@sharpcom.net) records it and sends it to you. You turn it into:
- a page in the library at **einyaakovshiur.com**, searchable by masechta, daf and topic;
- a podcast episode (Spotify, Apple, Amazon, iHeart all read `/feed.xml`);
- short clips for WhatsApp Status, YouTube Shorts and Reels.

People have told the Rav they love the site and love that the shiur comes out right after it's given. **Speed and accuracy both matter.** Aim to have the draft ready the same night.

Repo: `chreggie/ein-yaakov`, Next.js on Vercel. Every push to the working branch deploys to production. Technical background is in `HANDOFF.md`.

## The one rule that cannot be broken

**Never publish a shiur until Greg confirms its MP3 is uploaded to R2.** If the feed lists an episode whose audio returns 404, Spotify skips it and does not come back for it. That happened to Kesuvos 5. The fix was to bump `audio.rev`, which adds `?v=N` to the audio URL so the apps re-fetch the file. Avoid needing it.

## 1. Ingest

- Greg sends a file, or a Dropbox link. For a Dropbox link, change `dl=0` to `dl=1` and download with curl. Both `www.dropbox.com` and the Dropbox content host are allowed.
- Use a scratch folder per masechta: `$SCRATCH/<masechta>/{raw,out,tx}`.
- Name files `<Masechta>-NN.<ext>`, with NN the shiur number in that masechta, zero-padded (`Kesuvos-07.m4a`).
- Ask, or check `content/shiurim/<masechta>/`, for the next number. Kesuvos is the podcast's season 1. Baitza and Chagigah are library-only.

## 2. Clean the audio

```bash
pipeline/clean.sh raw/Kesuvos-07.m4a out/Kesuvos-07.mp3
pipeline/measure.sh out/Kesuvos-07.mp3   # expect about -16 LUFS and true peak <= -1 dBTP
```

`clean.sh` does the following:
- removes rumble and hum;
- applies light denoise;
- runs two-pass loudnorm to -16 LUFS;
- limits peaks, retrying at a lower ceiling until the true peak is at or below -1 dBTP;
- encodes a 64k mono MP3.

Don't add compression or music.

## 3. Transcribe

```bash
MASECHTA="Kesuvos (Kesubos, Ketubot)" THREADS=4 $SCRATCH/venv/bin/python pipeline/transcribe.py small.en tx out/Kesuvos-07.mp3
python3 pipeline/cond.py tx/Kesuvos-07.json 260    # condensed view, one line per ~75 s
```

The venv needs `faster-whisper` and `numpy`. A 45-minute shiur takes several minutes on CPU, so run it in the background.

The transcript is search-only: it's never shown on the page. It will garble Hebrew and Aramaic. That's expected. Use it to find structure and quotes, not to copy from.

## 4. Write the meta file

`pipeline/meta/<masechta>/NN.json`. Copy the shape of a recent one:

```json
{
 "masechta": "kesuvos", "number": 7,
 "status": "drafted", "in_feed": true, "given_on": "2026-11-10",
 "title": "…", "daf_start": "61b", "daf_end": "64a",
 "summary": "…", "key_ideas": ["…", "…", "…", "…"],
 "sources": [{"title": "…", "start": 1799}],
 "chapters": [{"start": 0, "title": "Where we are holding"}, …]
}
```

How to write each field:
- **The shiur's opening.** The first minute is the dedication (l'iluy nishmas…) and "where we are holding." Always make it chapter 0, titled **"Where we are holding."** Read the daf start from it.
- **title**
  - Name the shiur's main story or teaching, in plain English, in under about 60 characters.
  - Use the Gemara's own image when there is one: "Rav Bibi and the Angel of Death", "One Hundred and One Times".
  - No daf numbers and no masechta name in the title; the page adds those.
- **summary**
  - Two to four sentences, about 60–90 words, in present tense.
  - Open with the Gemara's phrase or the opening story.
  - Then list the main threads in the order they come.
  - Use the terms the Rav uses (tzedakah, hester panim, talmid chacham), transliterated Ashkenazi-style the way the site already spells them.
- **key_ideas**
  - Exactly four.
  - One sentence each, stating a lesson, not a topic.
  - These appear on the page and feed rich results.
- **sources**
  - Name commentaries, seforim and stories the Rav cites by name: Rashi, the Rambam, the Baal Shem Tov, the Rebbe, the Kotzker.
  - Add each one only after you have read the transcript around it and confirmed it's really a citation.
  - Known false positives:
    - "Tanya" often means *tanya*, "it was taught".
    - Mis-heard names like "Rashi Shiva" and "Dardizah".
    - "iyun".
  - When unsure, leave it out.
  - `start` is in seconds and becomes a click-to-play link.
- **chapters**
  - Twelve to twenty for a 45-minute shiur, at the real topic changes.
  - Snap each `start` to the transcript segment where the new topic actually begins.
  - Titles are short phrases: quote the pasuk or Gemara phrase when that's the hook (`"A red sash on a white horse"`).
- **given_on**
  - The Tuesday the shiur was given.
  - If it's unknown, especially for backfilled shiurim, use `null`. The site then hides the date. Greg said dates matter less than getting it up.
  - A shiur without `given_on` cannot go in the feed.
- **status**
  - `drafted` while you write; `reviewed` when Greg has read it; `published` only after the R2 confirmation.
- **in_feed**
  - `true` for season masechtos (Kesuvos).
  - `false` for library-only masechtos.

Send Greg the title, summary and chapter list to look over. The Rav is still to check sources and key ideas, so flag anything you're unsure of instead of guessing.

## 5. Build and publish

After Greg says the MP3 is in R2:

```bash
python3 pipeline/build_shiur.py pipeline/meta/kesuvos/07.json $SCRATCH/kesuvos/tx/Kesuvos-07.json $SCRATCH/kesuvos/out/Kesuvos-07.mp3 content/shiurim/kesuvos/07.json
npx tsc --noEmit && npx next build
git add pipeline/meta content/shiurim && git commit -m "Publish Kesuvos 7" && git push -u origin <branch>
```

- `build_shiur.py` keeps an existing `guid`. **Never change a guid once a shiur is in the feed**; podcast apps would show it as a new episode.
- The audio URL is `https://audio.einyaakovshiur.com/<masechta>/<Masechta>-NN.mp3`. If a file in R2 is ever replaced, add `"audio_rev": N` to the meta file and rebuild.
- The feed includes a shiur only when it's published, has `in_feed`, has `given_on`, and its masechta has a `season`.
- Check that the page is live after about 90 seconds. The container's curl is blocked from the site, so fetch the page with the Vercel MCP `web_fetch_vercel_url` and grep the saved result for the title.
- Spotify and Apple pick up the feed on their own schedules, usually within a few hours.

## 6. Choose clips

Pick one to three moments per shiur, each **30–60 seconds**. Good clips:
- **Open on a question or a surprise** that makes sense with no context: "Can giving tzedakah make you poorer?"
- **Tell a complete story** with a payoff, such as the Rebbe's diary story "You are the light in my house".
- **End on a punchline or lesson**, never mid-thought. End-of-clip silence is trimmed for you.
- **Have clear audio**: one speaker, not crosstalk or audience questions.
- **Avoid long Hebrew or Aramaic quotes**: the captions will mangle them.

Find candidates in the condensed transcript: the Rav's stories, "the Gemara says…", rhetorical questions. Note the second the moment starts in the cleaned MP3.

## 7. Build clips

Write `pipeline/clips/<masechta>-NN.json`, using `pipeline/clips/kesuvos-06.json` as the example.

Top level:
- `slug`, `source` (the cleaned MP3), `link` (`einyaakovshiur.com/<masechta>/<n>`), `masechta` (`"Kesuvos"`), `vocab` (extra transcription hints).

Per clip, where to cut:
- `at`: where the window starts in the MP3, in seconds.
- `window`: how many seconds to pull.
- `start_word` and `end_word`: the first and last words to keep. Add `end_after` when the end word also appears earlier.
- `fixes`: spelling corrections, as heard words → right words.

Per clip, on screen:
- `hook`: one or two lines; use `<br>` for the break.
- `sub`: "Kesuvos 50a · Shiur 6".

Per clip, post copy:
- `cta`: the question for the WhatsApp caption.
- `blurb`: two or three sentences for the Shorts description. For a story, stop before the ending so people watch.
- `from`: "Kesuvos 50a".
- `tags`: two or three hashtags (`#EinYaakov` and `#Shorts` are added for you).
- `shorts_title`: only when the default title (hook | Ein Yaakov <Masechta> | Rabbi Chaim Fogelman) doesn't read well.

```bash
SCRATCH=$SCRATCH $SCRATCH/venv/bin/python pipeline/clips/makeclip.py pipeline/clips/kesuvos-07.json $SCRATCH/clips
# one clip: add its id; one version: --only whatsapp | --only shorts
```

- **Step 1: transcribe and check.** The first run transcribes each window word by word and caches it as `<slug>-clipN.words.json`. Read those words and add `fixes` for every garbled term: Torah, the Aibershter, dalet, names. Re-run; it's fast once cached.
- **Step 2: what you get.** Each clip comes out in two versions from the same audio and captions:

| File | For | Layout |
| --- | --- | --- |
| `ein-yaakov-<slug>-clipN.mp4` | WhatsApp Status, Instagram Reels | Full layout: CTA block, waveform and gold progress bar at the bottom; end card lists Spotify, Apple, Amazon |
| `ein-yaakov-<slug>-shortN.mp4` | YouTube Shorts | Everything sits above y=1480 and left of x=900, so YouTube's title, channel row and like/comment/share buttons never cover it. No progress bar, since Shorts draws its own. A "Full shiur · einyaakovshiur.com" line under the waveform. End card: the link plus "Subscribe for a new shiur every week". |

  You also get:
  - a still card for each version (`…-clipN-card.jpg`, `…-shortN-card.jpg`);
  - `ein-yaakov-<slug>-clipN.txt` with the WhatsApp caption, the Shorts title (with its length checked against the 100-character limit) and the Shorts description. Send Greg the text with the videos.
- **Step 3: look before sending.** Pull a frame (`ffmpeg -ss 10 -i clip.mp4 -frames:v 1 f.png`) and check the captions. For a Short, also check it against the YouTube buttons: draw red boxes over the bottom 420 px, and over x≥910 between y=1000 and y=1500, and confirm nothing important is underneath.
- **Audio stays voice only.** Greg asked for no music. The clip chain is highpass, denoise (afftdn nr=30) and a gentle gate. Don't add a compressor: it pumped up the room noise.
- **Send the original MP4s.** A copy saved back from WhatsApp is recompressed and looks soft on YouTube.

## 8. Copy to send with clips

The `.txt` file the clip tool writes has all of this filled in; check it and adjust the wording.

**Calls to action:**
- Lead with a question from the clip, then 👇, then the link:
  > Why does tzedakah never make you poorer? Listen to the whole shiur 👇
  > https://www.einyaakovshiur.com/kesuvos/6
- Other lines Greg likes:
  - "Hear how the Rav finishes this story 👇"
  - "New shiur every week. Listen here or on Spotify and Apple 👇"
- Always use the **full `https://` shiur URL**. Each shiur page has its own preview card (title, daf, the Rav's photo), so the text doesn't need to repeat them.

**WhatsApp:**
- Post as a text status and paste the link.
- Wait for the preview to load before posting.
- If an old link shows no preview, add `?s` to the end.

**YouTube Shorts:**
- **Title**: `<hook> | Ein Yaakov <Masechta> | Rabbi Chaim Fogelman`, under 100 characters. For a story, name it instead: `"You are the light in my house" | A story from the Rebbe's diary | Rabbi Chaim Fogelman`.
- **Description**, in this order:
  1. the blurb;
  2. "From the Ein Yaakov shiur on <Masechta daf>. Listen to the whole shiur: einyaakovshiur.com/<masechta>/<n>";
  3. "New shiur every week, Tuesday nights at 8pm at the Itchkes Shtiebel. Also on Spotify and Apple Podcasts.";
  4. hashtags: `#EinYaakov` and two or three topic tags, then `#Shorts`.
- **Links aren't clickable** in Shorts descriptions or comments. Write the address as `einyaakovshiur.com/…` so people can type it, and rely on the end card. When full shiurim are on the channel, set each Short's **Related video** to its shiur: that gives a tappable link.
- **Upload from the YouTube phone app**, with the first frame (the hook) as the cover.
- **Don't turn on auto-subtitles**; the captions are already in the video.
- **Space Shorts a day or two apart** instead of posting a shiur's clips all at once.

## Brand rules

- **Name**: "Ein Yaakov with Rabbi Chaim Fogelman". In Hebrew, **עין יעקב** is always the main title. A masechta only appears as a smaller "מסכת X" line, so nothing reads as a Gemara shiur.
- **Colors**:
  - cover blue `#2d55ef` → `#0a2398` (135° gradient);
  - clip navy `#0f2680` → `#081a63`;
  - accent `#1d3fd1`;
  - gold highlight `#ffd76a`;
  - soft blue text `#c9d5ff`.
- **Type**: Figtree (500/600/700/800) for English; Frank Ruhl Libre 700 for Hebrew. The TTFs are in `assets/fonts/`.
- **Image renderers**: `next/og` (Satori) can't lay out right-to-left text, so pass Hebrew reversed (`visual()` in `lib/og.tsx`). Playwright and browsers handle Hebrew normally.
- **Photos**:
  - `public/rabbi.jpg` (455×526, the only photo of the Rav so far; ask Greg for a larger one when quality matters);
  - `assets/clips/rabbi-duo.png` (blue duotone, for clips);
  - `public/rabbi-shmuel-eliyahu-fogelman.jpg` (the dedication page, for the Rav's father; use it only there).
- **The brand kit page** (https://claude.ai/artifact/183oHMBXDFUbPCM2DDpn2x; republish it from this conversation, or pass that URL as `url` from another) lists every asset, its size and where it goes on each platform. The assets live in `design/youtube/`, `public/` and `assets/`. Update the kit when you make a new asset.
- **Not decided yet, waiting on the Rav**:
  - cover option A1 (it would replace `public/cover.jpg`, which still says "RABBI FOGELMAN");
  - the dedication wording;
  - the source and key-idea review.

## Commits

- End every commit with the session's Co-Authored-By trailer.
- No model names in commits or code.
- Push only to the working branch Greg set up for the session.
