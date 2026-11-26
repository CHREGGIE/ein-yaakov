#!/usr/bin/env python3
"""
Topic-page generator prototype for einyaakovshiur.com (spec: docs/TOPIC_PAGES.md).

Mirrors the matching rule the site implementation (lib/topics.ts) must use:

  A shiur matches a topic when its match score is >= the topic's score_min
  (default 2), where
    score = 2 * (number of key_ideas hits) + (number of chapter-title hits)
  and a hit is a case-insensitive, word-boundary keyword/phrase match over the
  normalized text of the key_idea / chapter title. Optional per-topic
  "always" / "never" lists (masechta/number) override the score.

A topic page exists only when at least MIN_SHIURIM (3) published shiurim match.
Everything is computed from the catalog at build time, so pages stay in sync
with the weekly publish.

Usage:
    python3 pipeline/topics_gen.py            # qualifying topics + evidence
    python3 pipeline/topics_gen.py --json    # full match dump as JSON
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MIN_SHIURIM = 3
DEFAULT_SCORE_MIN = 2


def norm(t: str) -> str:
    """Same normalization family as lib/search.ts norm(): lowercase, strip apostrophes/diacritics, keep letters/digits/space."""
    import unicodedata
    t = unicodedata.normalize("NFKD", t).lower()
    t = re.sub(r"[\u0591-\u05c7]", "", t)  # niqqud / cantillation
    t = t.replace("\u2019", "").replace("'", "").replace("\u201c", "").replace("\u201d", "").replace('"', "")
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def hit(patterns: list[re.Pattern], text: str) -> int:
    return sum(1 for p in patterns if p.search(text))


def load_catalog():
    published = []
    for f in sorted((REPO / "content" / "shiurim").glob("*/*.json")):
        s = json.loads(f.read_text())
        if s["status"] == "published":
            published.append(s)
    return published


def match_shiur(topic: dict, s: dict):
    """Return (score, evidence) for one shiur against one topic; (0, [])."""
    pats = [re.compile(rf"\b{re.escape(norm(k))}\b") for k in topic["match"]]
    ki = s.get("key_ideas") or []
    ki_hits = sum(hit(pats, norm(k)) for k in ki)
    ch_hits = sum(hit(pats, norm(c["title"])) for c in s["chapters"])
    score = 2 * ki_hits + ch_hits
    if f"{s['masechta']}/{s['number']}" in topic.get("never", []):
        return 0, []
    if f"{s['masechta']}/{s['number']}" in topic.get("always", []):
        score = max(score, topic.get("score_min", DEFAULT_SCORE_MIN))
    evidence = {
        "key_ideas": [k for k in ki if hit(pats, norm(k))],
        "chapters": [c["title"] for c in s["chapters"] if hit(pats, norm(c["title"]))],
    }
    return score, evidence


def main():
    topics = json.loads((REPO / "content" / "topics.json").read_text())
    shiurim = load_catalog()
    out = []
    for t in topics:
        smin = t.get("score_min", DEFAULT_SCORE_MIN)
        matches = []
        for s in shiurim:
            score, ev = match_shiur(t, s)
            if score >= smin:
                matches.append({
                    "id": f"{s['masechta']}/{s['number']}",
                    "title": s["title"],
                    "daf": f"{s['daf_start']}-{s['daf_end']}",
                    "score": score,
                    **ev,
                })
        matches.sort(key=lambda m: -m["score"])
        out.append({
            "slug": t["slug"],
            "title": t["title"],
            "qualifies": len(matches) >= MIN_SHIURIM,
            "count": len(matches),
            "matches": matches,
        })

    if "--json" in sys.argv:
        print(json.dumps(out, indent=1, ensure_ascii=False))
        return

    print(f"Catalog: {len(shiurim)} published shiurim. Threshold: >= {MIN_SHIURIM} matching shiurim, "
          f"score_min default {DEFAULT_SCORE_MIN} (one key_idea hit or two chapter hits).")
    for o in out:
        tag = "PAGE" if o["qualifies"] else "wait"
        print(f"\n[{tag}] /topics/{o['slug']} — {o['title']} — {o['count']} shiurim")
        for m in o["matches"]:
            print(f"    {m['id']:>12}  {m['title']}  ({m['daf']}, score {m['score']})")
            for k in m["key_ideas"]:
                print(f"         KI: {k}")
            for c in m["chapters"][:6]:
                print(f"         CH: {c}")
            if len(m["chapters"]) > 6:
                print(f"         CH: (+{len(m['chapters'])-6} more)")


if __name__ == "__main__":
    main()
