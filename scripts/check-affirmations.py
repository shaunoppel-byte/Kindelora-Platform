#!/usr/bin/env python3
"""Offline editorial gate: does not certify audio, entitlements or publication."""
import json,re
from pathlib import Path
paths=[Path(f"content/affirmations-v{i}.json") for i in (1,2,3,4)]
collections=[json.loads(p.read_text(encoding="utf-8")) for p in paths]
assert [len(c["scripts"]) for c in collections]==[30,60,110,100]
items=[item for collection in collections for item in collection["scripts"]]
norm=lambda s:re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()
assert len(items)==300
assert len({x["id"] for x in items})==300, "Duplicate IDs"
assert len({norm(x["text"]) for x in items})==300, "Duplicate text"
assert len({x["theme"] for x in items})==37, "Theme coverage incomplete"
for x in items:
 assert 35<=len(x["text"])<=240, "Unexpected script length: "+x["id"]
 assert x["status"]=="editorial-review" and x["approved"] is False
 assert x["audioMale"] is None and x["audioFemale"] is None
print("PASS: 300 unique unpublished candidate scripts across 37 themes; audio unproduced.")
