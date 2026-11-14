#!/usr/bin/env python3
"""Validate newly submitted cinematic raster assets without external dependencies.
Usage: python3 scripts/check-cinematic-raster-assets.py quality/cinematic-raster-manifest.json
The manifest contains only assets proposed for cinematic acceptance, not legacy SVGs.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "quality/cinematic-raster-manifest.json")
data = json.loads(manifest.read_text(encoding="utf-8"))
entries = data.get("assets", [])
errors = []
if not entries:
    errors.append("No cinematic raster assets submitted: empty manifest is not a passing acceptance result")
seen_paths, seen_hashes = set(), set()

def dimensions(blob, suffix):
    if suffix == ".png" and blob[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", blob[16:24])
    if suffix in (".jpg", ".jpeg") and blob[:2] == b"\xff\xd8":
        i = 2
        while i < len(blob) - 9:
            if blob[i] != 0xff:
                i += 1
                continue
            marker = blob[i+1]
            if marker in (0xd8, 0xd9):
                i += 2
                continue
            length = int.from_bytes(blob[i+2:i+4], "big")
            if marker in (0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf):
                return (int.from_bytes(blob[i+7:i+9], "big"), int.from_bytes(blob[i+5:i+7], "big"))
            i += 2 + length
    raise ValueError("unsupported or corrupt PNG/JPEG; verify format before submission")

for item in entries:
    name = item.get("id", "<missing-id>")
    path = item.get("path", "")
    if not path.startswith("assets/affirmations/") or ".." in path or path in seen_paths:
        errors.append(f"{name}: invalid or repeated asset path")
        continue
    seen_paths.add(path)
    asset = ROOT / path
    if not asset.is_file():
        errors.append(f"{name}: missing {path}")
        continue
    if asset.suffix.lower() not in (".png", ".jpg", ".jpeg"):
        errors.append(f"{name}: must be PNG/JPEG for this cinematic raster gate")
        continue
    raw = asset.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest in seen_hashes:
        errors.append(f"{name}: identical binary content reused")
    seen_hashes.add(digest)
    try:
        width, height = dimensions(raw, asset.suffix.lower())
        if width < 1536 or height < 2048:
            errors.append(f"{name}: {width}x{height} below 1536x2048 minimum")
        if not 0.70 <= width / height <= 0.80:
            errors.append(f"{name}: expected portrait aspect ratio near 3:4")
    except (ValueError, struct.error) as exc:
        errors.append(f"{name}: {exc}")
    if not item.get("provenance") or not (ROOT / item["provenance"]).is_file():
        errors.append(f"{name}: provenance record missing")
    source = (ROOT / "affirmation-library.js").read_text(encoding="utf-8")
    public_path = "/" + path
    if public_path not in source:
        errors.append(f"{name}: image is not mapped in affirmation-library.js")
    if item.get("review_status") != "approved":
        errors.append(f"{name}: independent visual review not recorded as approved")
print(json.dumps({"submitted":len(entries),"uniqueBinaryHashes":len(seen_hashes),"errors":errors},indent=2))
sys.exit(bool(errors))
