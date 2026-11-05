#!/usr/bin/env python3
"""Offline editorial gate; does not certify audio production or publication."""
import json,re
from pathlib import Path
paths=[Path("content/affirmations-v1.json"),Path("content/affirmations-v2.json")]
collections=[json.loads(p.read_text(encoding="utf-8")) for p in paths]
assert [len(c["scripts"]) for c in collections]==[30,60], "Expected 30+60 candidate scripts"
items=[item for collection in collections for item in collection["scripts"]]
norm=lambda s:re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()
assert len(items)==90
assert len({x["id"] for x in items})==90, "Duplicate IDs"
assert len({norm(x["text"]) for x in items})==90, "Duplicate text"
assert len({x["theme"] for x in items})==16, "Theme coverage incomplete"
for x in items:
 assert 35<=len(x["text"])<=240, "Unexpected script length: "+x["id"]
 assert x["status"]=="editorial-review" and x["approved"] is False
 assert x["audioMale"] is None and x["audioFemale"] is None, "No produced audio may be implied"
print("PASS: 90 unique unpublished candidate scripts across 16 themes; audio remains unproduced.")
