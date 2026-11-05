#!/usr/bin/env python3
"""Offline gate for candidate KINDELORA affirmation scripts. No live audio assertions."""
import json,re
from pathlib import Path
data=json.loads(Path("content/affirmations-v1.json").read_text(encoding="utf-8"))
items=data["scripts"]
assert len(items)==30, "Expected 30 editorial candidate scripts"
assert len({x["id"] for x in items})==30, "Duplicate IDs"
norm=lambda s:re.sub(r"[^a-z0-9]+"," ",s.casefold()).strip()
assert len({norm(x["text"]) for x in items})==30, "Duplicate text"
assert len({x["theme"] for x in items})==6, "Missing themes"
for x in items:
 assert 35<=len(x["text"])<=240, "Unexpected script length: "+x["id"]
 assert x["status"]=="editorial-review" and x["approved"] is False
 assert x["audioMale"] is None and x["audioFemale"] is None, "Do not claim produced audio"
print("PASS: 30 unique candidate affirmation scripts, 6 themes, all unpublished.")
