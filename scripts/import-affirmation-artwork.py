#!/usr/bin/env python3
"""Import reviewed image binaries on GitHub runner, not the user's phone/container.
Usage: python scripts/import-affirmation-artwork.py quality/affirmation-artwork-import.json
No changes are made unless every asset is downloaded and hash-verified.
"""
import hashlib, json, pathlib, sys, urllib.request, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / sys.argv[1]).read_text())
entries = manifest.get("assets", [])
if not entries:
    raise SystemExit("No import assets supplied; refusing empty import")
pending = []
seen = set()
for item in entries:
    name = item["filename"]
    url = item["sourceUrl"]
    digest = item["sha256"].lower()
    if not name.lower().endswith((".webp", ".jpg", ".jpeg", ".png")) or "/" in name or "\\" in name or name in seen:
        raise SystemExit("Invalid/duplicate filename: " + name)
    seen.add(name)
    parts = urllib.parse.urlparse(url)
    if parts.scheme != "https" or not parts.netloc or parts.username or parts.password:
        raise SystemExit("Only direct HTTPS asset sources allowed: " + name)
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise SystemExit("Invalid SHA-256: " + name)
    request = urllib.request.Request(url, headers={"User-Agent":"KINDELORA-Artwork-Importer/1.0"})
    with urllib.request.urlopen(request, timeout=40) as response:
        if response.geturl().split(":")[0] != "https":
            raise SystemExit("Redirect to non-HTTPS source rejected: " + name)
        data = response.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024 or len(data) < 10000:
        raise SystemExit("Artwork outside allowed 10KB–8MB size range: " + name)
    suffix = pathlib.Path(name).suffix.lower()
    if suffix == ".webp":
        valid = data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    elif suffix in (".jpg", ".jpeg"):
        valid = data[:3] == b"\\xff\\xd8\\xff" and data[-2:] == b"\\xff\\xd9"
    else:
        valid = data[:8] == b"\\x89PNG\\r\\n\\x1a\\n"
    if not valid:
        raise SystemExit("Image signature does not match extension: " + name)
    actual = hashlib.sha256(data).hexdigest()
    if actual != digest:
        raise SystemExit("SHA-256 mismatch for " + name + ": " + actual)
    pending.append((name, data))
out = ROOT / "assets" / "affirmations"
out.mkdir(parents=True, exist_ok=True)
for name, data in pending:
    (out / name).write_bytes(data)
    print("VERIFIED", name, len(data), hashlib.sha256(data).hexdigest())
print("All", len(pending), "binary artwork files imported successfully")
