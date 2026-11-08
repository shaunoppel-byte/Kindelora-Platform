#!/usr/bin/env python3
"""Fail-closed QA for original KINDELORA SVG artwork candidates (stdlib only)."""
from pathlib import Path
import hashlib
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NAMES = ("renewal", "resilience", "stillness", "self-worth")
SHA = {}
failures = []
for name in NAMES:
    path = ROOT / "assets" / "affirmations" / f"editorial-{name}.svg"
    if not path.is_file():
        failures.append(f"{name}: missing artwork")
        continue
    data = path.read_bytes()
    if len(data) > 200_000:
        failures.append(f"{name}: excessive SVG size")
    if any(token in data.lower() for token in (b"<script", b"<foreignobject", b"javascript:", b"data:", b"<image", b"<!doctype", b"<!entity", b"onload=", b"onclick=", b"<use", b"<style")):
        failures.append(f"{name}: potentially unsafe SVG construct")
    try:
        root = ET.fromstring(data)
        if root.tag != "{http://www.w3.org/2000/svg}svg":
            failures.append(f"{name}: invalid SVG root")
        if root.attrib.get("viewBox") != "0 0 1200 1600":
            failures.append(f"{name}: portrait dimensions mismatch")
        for element in root.iter():
            if not element.tag.startswith("{http://www.w3.org/2000/svg}"):
                failures.append(f"{name}: unexpected namespace")
            for key, value in element.attrib.items():
                if key.lower().startswith("on") or "href" in key.lower() or "url(http" in value.lower():
                    failures.append(f"{name}: external or active reference")
    except ET.ParseError as exc:
        failures.append(f"{name}: malformed XML: {exc}")
    digest = hashlib.sha256(data).hexdigest()
    if digest in SHA:
        failures.append(f"{name}: identical bytes to {SHA[digest]}")
    SHA[digest] = name
    print(f"{name}: sha256={digest} bytes={len(data)}")
if failures:
    print("FAIL: " + "; ".join(failures), file=sys.stderr)
    sys.exit(1)
print("PASS: four distinct, parseable, portrait SVG candidates; visual and accessibility QA still required")
