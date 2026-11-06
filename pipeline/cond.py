import json,sys
d=json.load(open(sys.argv[1])); cur=[];st=None; w=int(sys.argv[2]) if len(sys.argv)>2 else 260
def fl():
    t=" ".join(cur); print(f"[{int(st//60)}:{int(st%60):02d}] {t[:w]}")
for s in d["segments"]:
    if st is None: st=s["start"]
    cur.append(s["text"])
    if s["start"]-st>=75: fl(); cur=[]; st=None
if cur: fl()
