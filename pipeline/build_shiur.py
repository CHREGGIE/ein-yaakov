"""Usage: python build_shiur.py META.json TRANSCRIPT.json AUDIO.mp3 OUT.json

Combines reviewed metadata (title, daf, summary, chapters, date) with the Whisper
transcript and the published MP3's size and length into one catalog file under
content/shiurim/<masechta>/NN.json. Re-running keeps the existing guid, which must
never change once a shiur is in the podcast feed.
"""
import json, os, subprocess, sys, uuid

meta_path, tx_path, audio_path, out_path = sys.argv[1:]
meta = json.load(open(meta_path))
tx = json.load(open(tx_path))

# Group Whisper segments into readable paragraphs: break at chapter starts or after ~60s.
starts = sorted(c["start"] for c in meta["chapters"])
paras, cur, cur_start = [], [], None
for seg in tx["segments"]:
    crosses = any(cur_start is not None and cur_start < c <= seg["start"] for c in starts)
    if cur and (crosses or seg["start"] - cur_start >= 60):
        paras.append({"start": int(cur_start), "text": " ".join(cur)})
        cur, cur_start = [], None
    if cur_start is None:
        cur_start = seg["start"]
    cur.append(seg["text"])
if cur:
    paras.append({"start": int(cur_start), "text": " ".join(cur)})

dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio_path],
                           capture_output=True, text=True, check=True).stdout)
guid = json.load(open(out_path))["guid"] if os.path.exists(out_path) else str(uuid.uuid4())

out = {
    "guid": guid,
    "masechta": meta["masechta"], "number": meta["number"],
    "status": meta.get("status", "drafted"), "in_feed": meta.get("in_feed", False),
    "given_on": meta.get("given_on"),
    "title": meta["title"], **({"label": meta["label"]} if meta.get("label") else {}),
    "daf_start": meta["daf_start"], "daf_end": meta["daf_end"],
    "summary": meta["summary"], **({"dedication": meta["dedication"]} if meta.get("dedication") else {}),
    **({"key_ideas": meta["key_ideas"]} if meta.get("key_ideas") else {}),
    **({"sources": meta["sources"]} if meta.get("sources") else {}),
    "chapters": meta["chapters"],
    "audio": {"file": os.path.basename(audio_path), "bytes": os.path.getsize(audio_path), "duration_sec": round(dur)},
    "transcript": paras,
}
os.makedirs(os.path.dirname(out_path), exist_ok=True)
json.dump(out, open(out_path, "w"), ensure_ascii=False, indent=1)
print(f"{out_path}: {len(paras)} paragraphs, {round(dur)}s")
