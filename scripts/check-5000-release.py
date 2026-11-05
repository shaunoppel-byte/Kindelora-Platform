"""Strict preflight for the proposed 5,000-message KINDELORA release.

Run only when content/message-library-expansion-3000.json is ready.
Never equate automated validation with human editorial approval.
"""
import json, re, sys
from pathlib import Path
from collections import Counter

ROOT=Path("content")
CANDIDATE=ROOT/"message-library-expansion-3000.json"
APPROVAL=ROOT/"message-library-5000-approvals.json"
if not CANDIDATE.exists():
    print("PENDING: 3,000-message candidate batch not yet submitted. No release authorised.")
    sys.exit(0)

baseline=[]
for n in range(1,13):
    baseline.extend(json.loads((ROOT/f"message-library-v{n}.json").read_text(encoding="utf-8"))["messages"])
assert len(baseline)==2000, "Baseline has changed; reconcile before review"
batch=json.loads(CANDIDATE.read_text(encoding="utf-8"))["messages"]
assert len(batch)==3000, f"Expected 3000 candidates, found {len(batch)}"
all_items=baseline+batch
ids=[m["id"] for m in all_items]
assert len(set(ids))==5000, "Duplicate message IDs"
def norm(s):
    return re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()
texts=[norm(m["text"]) for m in all_items]
assert len(set(texts))==5000, "Exact or punctuation-only duplicate"
for m in batch:
    assert m["status"]=="editorial-review", f"Unreviewed release status: {m['id']}"
    assert m["audience"]=="all" and m["tone"]=="warm-grounded",m["id"]
    assert 8<=len(m["text"].split())<=40, f"Length outside editorial bounds: {m['id']}"
    assert not re.search(r"\\b(guaranteed|cure|always be happy|just be positive)\\b",m["text"],re.I),m["id"]
    assert m["text"].strip().endswith((".","!","?")),m["id"]
stop=set("a an the and or of to for in on at from by with as is are was were be been being it its you your yours we our they their that this those these can could may might will would should do does did not no need have has had when while if even still only just something someone anyone anything one some more less than then into through about before after without every each there here what how why who which all another other yourself today tomorrow sometimes often also rather instead".split())
def tok(s):
    return {w for w in re.findall(r"[a-z]+",s.lower()) if len(w)>3 and w not in stop}
tokens=[tok(m["text"]) for m in all_items]
inverted={}
for i,ts in enumerate(tokens):
    for w in ts:
        inverted.setdefault(w,[]).append(i)
flags=[]
for i in range(2000,5000):
    candidates=Counter(j for w in tokens[i] for j in inverted[w] if j<i)
    for j,common in candidates.items():
        if common>=3 and 2*common/(len(tokens[i])+len(tokens[j]))>=.60:
            flags.append((ids[i],ids[j]))
assert not flags, f"{len(flags)} high lexical-overlap pairs require editorial review: {flags[:12]}"
if not APPROVAL.exists():
    print("PENDING: technical screening passed; signed editorial approval manifest is missing.")
    sys.exit(0)
approval=json.loads(APPROVAL.read_text(encoding="utf-8"))
assert approval.get("reviewer") and approval.get("approved_at"),"Missing named reviewer/date"
assert set(approval.get("approved_ids",[]))==set(ids[2000:]),"Not all 3000 texts individually approved"
assert approval.get("reviewed_sha256"),"Approval must bind to an immutable reviewed batch hash"
import hashlib
digest=hashlib.sha256(CANDIDATE.read_bytes()).hexdigest()
assert digest==approval["reviewed_sha256"],"Batch changed since editorial approval"
print("PASS: 5000-message preflight, 3000 approved candidate IDs, uniqueness, lexical screening and content hash.")
