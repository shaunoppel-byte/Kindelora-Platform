#!/usr/bin/env python3
"""KINDELORA affirmation artwork contract: fail CI if the four-card baseline regresses."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
assert html.count('class="free-affirmation-card"') == 4, "Exactly four free affirmation cards required"
assert html.count('class="art affirmation-inline-svg"') == 1, "Fourth artwork must be embedded"
assert html.count('/* KINDELORA Affirmation Artwork Contract v1') == 1
assert html.count('/* P0 gallery image-fit') == 0, "Legacy competing gallery overrides must be removed"
assert html.count('/* P0 v2:') == 0
assert html.count('/* Definitive image geometry:') == 0
for name in ("small-steps-still-count.png","rest-is-part-of-growing.png","the-light-returns.png","i-am-enough-as-i-am.svg"):
    path = ROOT / "affirmations" / "artwork" / name
    assert path.is_file() and path.stat().st_size > 1000, f"Missing or empty artwork: {path}"
for key in ("affirmation-four-sky","affirmation-four-glow","affirmation-four-shade","affirmation-four-lake"):
    assert f'id="{key}"' in html and f'url(#{key})' in html, f"Broken SVG gradient: {key}"
assert 'aria-labelledby="affirmation-four-title affirmation-four-desc"' in html
assert '#free-affirmations .free-affirmation-card > :is(img.art,svg.affirmation-inline-svg)' in html
assert 'aspect-ratio:10/7!important' in html
print("PASS: four affirmation cards, source assets, SVG gradients and single authoritative gallery contract")
