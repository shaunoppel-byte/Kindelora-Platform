"""Additional editorial QA: detect overlapping meaning and risky wording.

Produces an advisory report. Similarity flags require human review; they do not
automatically reject compassionate language or approve any message for release.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

paths = sorted(Path("content").glob("message-library-v*.json"), key=lambda p: int(re.search(r"v(\d+)\.json$", p.name).group(1)))
items = [m for p in paths for m in json.loads(p.read_text(encoding="utf-8"))["messages"]]
stop = set("a an the and or of to for in on at from by with as is are was were be been being it its you your yours we our they their that this those these can could may might will would should do does did not no need have has had when while if even still only just something someone anyone anything one some more less than then into through about before after without every each there here what how why who which all another other yourself today tomorrow sometimes often also rather instead".split())
def tokens(text):
    return {w for w in re.findall(r"[a-z]+", text.lower()) if len(w)>3 and w not in stop}
def dice(a,b):
    return 2*len(a&b)/(len(a)+len(b)) if a and b else 0.0
groups=defaultdict(list)
for m in items:
    groups[m["theme"]].append(m)
# Exact lexical equivalence to the previous O(n^2) comparison, with a
# token posting-list index. Only pairs sharing >=3 non-stopword tokens can
# satisfy the existing review rule; all other pairs are provably ineligible.
# This keeps full-corpus audits practical as the library approaches 5,000.
from collections import Counter
token_sets = [tokens(m["text"]) for m in items]
postings = defaultdict(list)
for idx, words in enumerate(token_sets):
    for word in words:
        postings[word].append(idx)
shared_counts = Counter()
for ids in postings.values():
    for i, a in enumerate(ids):
        for b in ids[i+1:]:
            shared_counts[(a,b)] += 1
pairs=[]
for (i,j), overlap in shared_counts.items():
    if overlap < 3:
        continue
    ta,tb=token_sets[i],token_sets[j]
    score=2*overlap/(len(ta)+len(tb))
    if score>=0.60:
        pairs.append((score,items[i],items[j]))
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
"**Audit method:** full corpus, indexed exact token-overlap enumeration (same >=3 shared tokens rule).",
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
report="\n".join(lines)+"\n"
Path("content/EDITORIAL_AUDIT.md").write_text(report,encoding="utf-8")
print(f"Audit complete: {len(items)} messages; {len(pairs)} advisory overlaps; {len(flags)} wording flags")
if flags:
    print("REVIEW REQUIRED: sensitive wording flags detected; do not treat this as clean editorial approval.")
