"""Advisory corpus-wide repeated-sentence audit; never grants publication approval.

Run: python scripts/audit-repeated-sentences.py
Exit code 1 indicates repetition requiring contextual editorial review.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

paths = sorted(Path("content").glob("message-library-v*.json"),
               key=lambda p: int(re.search(r"v(\d+)\.json$", p.name).group(1)))
occurrences = defaultdict(list)
ids = set()
for path in paths:
    batch = json.loads(path.read_text(encoding="utf-8"))
    for message in batch["messages"]:
        mid = message["id"]
        if mid in ids:
            raise SystemExit(f"FAIL duplicate ID across batches: {mid}")
        ids.add(mid)
        sentences = re.split(r"(?<=[.!?])\s+", message["text"].strip())
        for sentence in sentences:
            normalized = re.sub(r"[^a-z0-9]+", " ", sentence.casefold()).strip()
            # Short common sentences are less diagnostic; flag repeated substantive ones.
            if len(normalized.split()) >= 7:
                occurrences[normalized].append((path.name, mid))
repeats = [(sentence, refs) for sentence, refs in occurrences.items()
           if len(set(mid for _, mid in refs)) >= 5]
repeats.sort(key=lambda pair: (-len(pair[1]), pair[0]))
print(f"Inspected {len(ids)} unique message IDs across {len(paths)} batches.")
print(f"Substantive sentences repeated in five or more messages: {len(repeats)}")
for sentence, refs in repeats[:60]:
    print(f"REVIEW {len(refs)}x: {sentence}")
    print("  " + ", ".join(f"{batch}:{mid}" for batch, mid in refs[:12]))
if repeats:
    raise SystemExit("REVIEW REQUIRED: repeated sentences need contextual editorial assessment.")
print("PASS: no substantive sentence repeated five or more times (not editorial approval).")
