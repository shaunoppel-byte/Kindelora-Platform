"""Validate KINDELORA's curated message library before publication."""
import json, re
from collections import Counter
from pathlib import Path
paths=[Path("content/message-library-v1.json"),Path("content/message-library-v2.json"),Path("content/message-library-v3.json"),Path("content/message-library-v4.json"),Path("content/message-library-v5.json"),Path("content/message-library-v6.json"),Path("content/message-library-v7.json"),Path("content/message-library-v8.json"),Path("content/message-library-v9.json"),Path("content/message-library-v10.json"),Path("content/message-library-v11.json"),Path("content/message-library-v12.json"),Path("content/message-library-v13.json"),Path("content/message-library-v14.json"),Path("content/message-library-v15.json"),Path("content/message-library-v16.json"),Path("content/message-library-v17.json"),Path("content/message-library-v18.json"),Path("content/message-library-v19.json"),Path("content/message-library-v20.json"),Path("content/message-library-v21.json"),Path("content/message-library-v22.json"),Path("content/message-library-v23.json"),Path("content/message-library-v24.json"),Path("content/message-library-v25.json"),Path("content/message-library-v26.json"),Path("content/message-library-v27.json"),Path("content/message-library-v28.json"),Path("content/message-library-v29.json"),Path("content/message-library-v30.json"),Path("content/message-library-v31.json"),Path("content/message-library-v32.json"),Path("content/message-library-v33.json"),Path("content/message-library-v34.json"),Path("content/message-library-v35.json"),Path("content/message-library-v36.json"),Path("content/message-library-v37.json"),Path("content/message-library-v38.json"),Path("content/message-library-v39.json")]
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
assert len(collections[13]["messages"])==20, "Expansion batch 14 must contain 20 messages"
assert len(collections[14]["messages"])==20, "Expansion batch 15 must contain 20 messages"
assert len(collections[15]["messages"])==30, "Expansion batch 16 must contain 30 messages"
assert len(collections[16]["messages"])==20, "Expansion batch 17 must contain 20 messages"
assert len(collections[17]["messages"])==20, "Expansion batch 18 must contain 20 messages"
assert len(collections[18]["messages"])==30, "Expansion batch 19 must contain 30 messages"
assert len(collections[19]["messages"])==20, "Expansion batch 20 must contain 20 messages"
assert len(collections[20]["messages"])==20, "Expansion batch 21 must contain 20 messages"
assert len(collections[21]["messages"])==25, "Expansion batch 22 must contain 25 messages"
assert len(collections[22]["messages"])==30, "Expansion batch 23 must contain 30 messages"
assert len(collections[23]["messages"])==20, "Expansion batch 24 must contain 20 messages"
assert len(collections[24]["messages"])==25, "Expansion batch 25 must contain 25 messages"
assert len(collections[25]["messages"])==30, "Expansion batch 26 must contain 30 messages"
assert len(collections[26]["messages"])==25, "Expansion batch 27 must contain 25 messages"
assert len(collections[27]["messages"])==40, "Expansion batch 28 must contain 40 messages"
assert len(collections[28]["messages"])==40, "Expansion batch 29 must contain 40 messages"
assert len(collections[29]["messages"])==30, "Expansion batch 30 must contain 30 messages"
assert len(collections[30]["messages"])==30, "Expansion batch 31 must contain 30 messages"
assert len(collections[31]["messages"])==30, "Expansion batch 32 must contain 30 messages"
assert len(collections[32]["messages"])==20, "Expansion batch 33 must contain 20 messages"
assert len(collections[33]["messages"])==50, "Batch 34 must contain exactly 50 messages"
assert len(collections[34]["messages"])==75, "Batch 35 must contain exactly 75 messages"
assert len(collections[35]["messages"])==75, "Batch 36 must contain exactly 75 messages"
assert len(collections[36]["messages"])==75, "Batch 37 must contain exactly 75 messages"
assert len(collections[37]["messages"])==100, "Batch 38 must contain exactly 100 messages"
assert len(collections[38]["messages"])==25, "Batch 39 must contain exactly 25 messages"
assert len(items)==3025, "Combined editorial library count mismatch"
ids=[x["id"] for x in items]
assert len(set(ids))==len(ids), "Duplicate message IDs"
norm=[re.sub(r"[^a-z0-9]+"," ",x["text"].casefold()).strip() for x in items]
assert len(set(norm))==len(norm), "Duplicate message text"
themes=Counter(x["theme"] for x in items)
assert len(themes)==378 and all(n>=5 for n in themes.values()), "Theme coverage insufficient"
for x in items:
    assert x["status"]=="editorial-review", "Do not silently publish unapproved content"
    assert x["audience"]=="all" and x["tone"]=="warm-grounded"
    assert 8<=len(x["text"].split())<=40, f"Review message length: {x['id']}"
    assert not re.search(r"\b(guaranteed|cure|always be happy|just be positive)\b",x["text"],re.I),f"Unsafe claim: {x['id']}"
catalogue=json.loads(Path("message-catalogue.json").read_text(encoding="utf-8"))
assert catalogue["count"]==len(catalogue["messages"]), "Public catalogue count mismatch"
assert catalogue["count"] in (2100,2625), "Unexpected publication count; only baseline or full founder-approved candidate permitted"
assert [x["id"] for x in catalogue["messages"]]==[x["id"] for x in items[:catalogue["count"]]], "Catalogue must match editorial source IDs and order"
source_by_id={m["id"]:m["text"] for m in items}
assert all(x["text"]==source_by_id[x["id"]] for x in catalogue["messages"]), "Public catalogue content mismatch"
assert all(x["theme"]==items[i]["theme"] for i,x in enumerate(catalogue["messages"])), "Catalogue theme mismatch"
assert len(set(x["id"] for x in catalogue["messages"]))==catalogue["count"], "Duplicate public IDs"
assert catalogue["count"]==2100 or catalogue["release"]=="2026-11-07-founder-approved-2625-release-candidate", "Full expansion requires explicit founder-approved release label"
print(f"PASS: {len(items)} unique draft messages across {len(themes)} themes; all marked for editorial review.")
