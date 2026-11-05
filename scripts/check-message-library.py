"""Validate KINDELORA's curated message library before publication."""
import json, re
from collections import Counter
from pathlib import Path
paths=[Path("content/message-library-v1.json"),Path("content/message-library-v2.json"),Path("content/message-library-v3.json"),Path("content/message-library-v4.json"),Path("content/message-library-v5.json"),Path("content/message-library-v6.json"),Path("content/message-library-v7.json"),Path("content/message-library-v8.json"),Path("content/message-library-v9.json"),Path("content/message-library-v10.json"),Path("content/message-library-v11.json"),Path("content/message-library-v12.json"),Path("content/message-library-v13.json")]
collections=[json.loads(path.read_text(encoding="utf-8")) for path in paths]
items=[msg for collection in collections for msg in collection["messages"]]
assert len(collections[0]["messages"])==120, "First editorial batch count changed"
assert len(collections[1]["messages"])==150, "Second editorial batch must contain exactly 150 messages"
assert len(collections[2]["messages"])==150, "Third editorial batch must contain exactly 150 messages"
assert len(collections[3]["messages"])==150, "Fourth editorial batch must contain exactly 150 messages"
assert len(collections[4]["messages"])==430, "Fifth editorial batch must contain exactly 430 messages"
assert len(collections[5]["messages"])==100, "Expansion batch 6 must contain 100 messages"
assert len(collections[6]["messages"])==100, "Expansion batch 7 must contain 100 messages"
assert len(collections[7]["messages"])==100, "Expansion batch 8 must contain 100 messages"
assert len(collections[8]["messages"])==100, "Expansion batch 9 must contain 100 messages"
assert len(collections[9]["messages"])==200, "Expansion batch 10 must contain 200 messages"
assert len(collections[10]["messages"])==200, "Expansion batch 11 must contain 200 messages"
assert len(collections[11]["messages"])==200, "Expansion batch 12 must contain 200 messages"
assert len(collections[12]["messages"])==100, "Expansion batch 13 must contain 100 messages"
assert len(items)==2100, "Combined editorial library count mismatch"
ids=[x["id"] for x in items]
assert len(set(ids))==len(ids), "Duplicate message IDs"
norm=[re.sub(r"[^a-z0-9]+"," ",x["text"].casefold()).strip() for x in items]
assert len(set(norm))==len(norm), "Duplicate message text"
themes=Counter(x["theme"] for x in items)
assert len(themes)==193 and all(n>=10 for n in themes.values()), "Theme coverage insufficient"
for x in items:
    assert x["status"]=="editorial-review", "Do not silently publish unapproved content"
    assert x["audience"]=="all" and x["tone"]=="warm-grounded"
    assert 8<=len(x["text"].split())<=40, f"Review message length: {x['id']}"
    assert not re.search(r"\b(guaranteed|cure|always be happy|just be positive)\b",x["text"],re.I),f"Unsafe claim: {x['id']}"
catalogue=json.loads(Path("message-catalogue.json").read_text(encoding="utf-8"))
assert catalogue["count"]==2000 and len(catalogue["messages"])==2000, "Public catalogue count mismatch"
assert {x["id"] for x in catalogue["messages"]}==set(ids[:2000]), "Public catalogue missing approved messages"
assert all(x["text"]==next(m["text"] for m in items if m["id"]==x["id"]) for x in catalogue["messages"]), "Public catalogue content mismatch"
print(f"PASS: {len(items)} unique draft messages across {len(themes)} themes; all marked for editorial review.")
