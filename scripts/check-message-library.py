"""Validate KINDELORA's curated message library before publication."""
import json, re
from collections import Counter
from pathlib import Path
path=Path("content/message-library-v1.json")
data=json.loads(path.read_text(encoding="utf-8"))
items=data["messages"]
assert len(items)>=120, "Library expansion incomplete"
ids=[x["id"] for x in items]
assert len(set(ids))==len(ids), "Duplicate message IDs"
norm=[re.sub(r"[^a-z0-9]+"," ",x["text"].casefold()).strip() for x in items]
assert len(set(norm))==len(norm), "Duplicate message text"
themes=Counter(x["theme"] for x in items)
assert len(themes)>=10 and all(n>=10 for n in themes.values()), "Theme coverage insufficient"
for x in items:
    assert x["status"]=="editorial-review", "Do not silently publish unapproved content"
    assert x["audience"]=="all" and x["tone"]=="warm-grounded"
    assert 8<=len(x["text"].split())<=40, f"Review message length: {x['id']}"
    assert not re.search(r"\b(guaranteed|cure|always be happy|just be positive)\b",x["text"],re.I),f"Unsafe claim: {x['id']}"
print(f"PASS: {len(items)} unique draft messages across {len(themes)} themes; all marked for editorial review.")
