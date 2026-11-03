"""Usage: python build_preview.py CONTENT_DIR OUT_CATALOG_JS

Writes catalog.js for design/prototype.html from the published catalog files, pointing
each shiur at the preview audio copy published beside the page (audio/<masechta>-NN.mp4).
"""
import glob, json, os, sys

content, out = sys.argv[1:]
masechtos = json.load(open(os.path.join(content, "masechtos.json")))
shiurim = []
for f in sorted(glob.glob(os.path.join(content, "shiurim", "*", "*.json"))):
    s = json.load(open(f))
    if s["status"] != "published":
        continue
    s["src"] = f"audio/{s['masechta']}-{s['number']:02d}.mp4"
    shiurim.append(s)
live = {s["masechta"] for s in shiurim}
data = {"masechtos": [m for m in masechtos if m["slug"] in live], "shiurim": shiurim}
open(out, "w").write("window.CATALOG = " + json.dumps(data, ensure_ascii=False) + ";\n")
print(f"{out}: {len(shiurim)} shiurim")
