"""Additional editorial QA: detect overlapping meaning and risky wording.

Produces an advisory report. Similarity flags require human review; they do not
automatically reject compassionate language or approve any message for release.
"""
import json
import re
from collections import defaultdict
from itertools import combinations
from pathlib import Path

paths = sorted(Path("content").glob("message-library-v*.json"))
items = [m for p in paths for m in json.loads(p.read_text(encoding="utf-8"))["messages"]]
stop = set("a an the and or of to for in on at from by with as is are was were be been being it its you your yours we our they their that this those these can could may might will would should do does did not no need have has had when while if even still only just something someone anyone anything one some more less than then into through about before after without every each there here what how why who which all another other yourself today tomorrow sometimes often also rather instead".split())
def tokens(text):
    return {w for w in re.findall(r"[a-z]+", text.lower()) if len(w)>3 and w not in stop}
def dice(a,b):
    return 2*len(a&b)/(len(a)+len(b)) if a and b else 0.0
groups=defaultdict(list)
for m in items:
    groups[m["theme"]].append(m)
pairs=[]
for a,b in combinations(items,2):
    ta,tb=tokens(a["text"]),tokens(b["text"])
    score=dice(ta,tb)
    if score>=0.60 and len(ta&tb)>=3:
        pairs.append((score,a,b))
pairs.sort(key=lambda p:(-p[0],p[1]["id"],p[2]["id"]))
review_terms = [
    (r"\b(always|never)\b", "absolute language"),
    (r"\b(cure|guarantee|diagnose|treatment)\b", "health or outcome claim"),
    (r"\b(suicide|self.harm)\b", "sensitive topic requiring specialist review"),
]
flags=[]
for m in items:
    for pattern,label in review_terms:
        if re.search(pattern,m["text"],re.I):
            flags.append((m["id"],label))
lines=[
"# KINDELORA — Editorial Similarity Audit",
"",
f"**Messages inspected:** {len(items)} across {len(groups)} themes.",
f"**Potential wording/semantic overlap pairs (token Dice >= 0.60):** {len(pairs)}.",
f"**Sensitive wording flags:** {len(flags)}.",
"",
"Automated lexical overlap is an advisory signal, **not** proof of duplicated meaning.",
"Subtle paraphrases may evade detection. All content remains editorial-review and",
"requires human review of emotional relevance, inclusivity, contextual appropriateness,",
"and the reader's likely interpretation before release.",
"",
"## Highest-overlap pairs (up to 100)",
]
for score,a,b in pairs[:100]:
    lines.extend([f"- **{score:.2f}** — {a['id']} / {b['id']}",f"  - {a['text']}",f"  - {b['text']}"])
lines.extend(["","## Wording requiring attention"])
lines.extend([f"- {mid}: {label}" for mid,label in flags] or ["- No matches for configured review terms."])
lines.extend(["","## Release decision","**NOT APPROVED FOR LIVE ROTATION.** Review, revise, and explicitly approve a release manifest first."])
report="\n".join(lines)+"\\n"
Path("content/EDITORIAL_AUDIT.md").write_text(report,encoding="utf-8")
print(f"Audit complete: {len(items)} messages; {len(pairs)} advisory overlaps; {len(flags)} wording flags")
if flags:
    print("REVIEW REQUIRED: sensitive wording flags detected; do not treat this as clean editorial approval.")
