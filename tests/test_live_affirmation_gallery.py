#!/usr/bin/env python3
"""KINDELORA live affirmation gallery acceptance tests. Requires playwright + Chromium."""
import os
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

BASE = os.environ.get("QA_BASE_URL", "https://kindelora.pages.dev").rstrip("/")
OUT = Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
VIEWPORTS = [
    ("desktop", 1440, 900),
    ("tablet", 768, 1024),
    ("mobile", 390, 844),
    ("small-mobile", 320, 720),
]
EXPECTED = [
    "Small steps still count",
    "Rest is part of growing",
    "The light returns",
    "I am enough as I am",
]


def check_gallery(browser, name, width, height):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    failures = []
    page.on("pageerror", lambda exc: failures.append(f"JavaScript exception: {exc}"))
    try:
        response = page.goto(BASE + "/#free-affirmations", wait_until="domcontentloaded", timeout=60000)
        assert response and response.ok, f"Homepage HTTP error: {response.status if response else 'no response'}"
        gallery = page.locator("#free-affirmations .free-affirmation-card")
        assert gallery.count() == 4, f"Expected 4 cards, found {gallery.count()}"
        gallery.first.scroll_into_view_if_needed()
        page.wait_for_timeout(1200)
        for i, title in enumerate(EXPECTED):
            card = gallery.nth(i)
            assert card.locator("h3").inner_text().strip() == title, f"Card {i+1} title mismatch"
            art = card.locator(":scope > img.art, :scope > svg.affirmation-inline-svg")
            assert art.count() == 1, f"Card {i+1}: missing/duplicate artwork"
            if art.evaluate("(el) => el.tagName.toLowerCase()") == "img":
                art.scroll_into_view_if_needed()
                art.evaluate("(el) => { if (el.loading === 'lazy') el.loading = 'eager'; }")
                art.evaluate("(el) => el.decode()")
                valid = art.evaluate("(el) => el.complete && el.naturalWidth > 0 && el.naturalHeight > 0")
                assert valid, f"Card {i+1}: image failed to decode"
            else:
                assert art.locator("title").count() == 1, "Fourth card SVG has no title"
            metrics = art.evaluate("""(el) => {
              const a=el.getBoundingClientRect(), c=el.parentElement.getBoundingClientRect();
              const s=getComputedStyle(el);
              return {left:a.left,right:a.right,top:a.top,width:a.width,height:a.height,
                cardLeft:c.left,cardRight:c.right,cardTop:c.top,
                position:s.position,fit:s.objectFit};
            }""")
            assert metrics["width"] > 100 and metrics["height"] > 100, f"Card {i+1}: artwork collapsed"
            assert abs(metrics["left"] - metrics["cardLeft"]) <= 2, f"Card {i+1}: artwork left gap"
            assert abs(metrics["right"] - metrics["cardRight"]) <= 2, f"Card {i+1}: artwork right gap"
            assert abs(metrics["top"] - metrics["cardTop"]) <= 2, f"Card {i+1}: artwork top gap"
            ratio = metrics["width"] / metrics["height"]
            assert 1.35 < ratio < 1.52, f"Card {i+1}: wrong artwork frame ratio {ratio:.2f}"
            download = card.locator("a.gallery-download")
            assert download.count() == 1, f"Card {i+1}: missing download action"
            href = download.get_attribute("href")
            assert href and href.startswith("/"), f"Card {i+1}: invalid download path"
            asset = page.request.get(urljoin(BASE, href), timeout=30000)
            assert asset.ok and len(asset.body()) > 1000, f"Card {i+1}: download missing or empty (HTTP {asset.status})"
        page.locator("#free-affirmations").screenshot(path=str(OUT / f"affirmations-{name}.png"), animations="disabled", timeout=30000)
        no_overflow = page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2")
        assert no_overflow, f"{name}: horizontal page overflow"
        assert not failures, "; ".join(failures)
        print(f"PASS {name}: all four images rendered, frames aligned, downloads valid, no overflow")
    finally:
        page.close()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        failed = []
        for name, width, height in VIEWPORTS:
            try:
                check_gallery(browser, name, width, height)
            except Exception as exc:
                failed.append(f"{name}: {exc}")
                print(f"FAIL {name}: {exc}")
        browser.close()
    if failed:
        raise SystemExit("Visual QA failed:\n" + "\n".join(failed))
    print("PASS: all desktop/tablet/mobile gallery checks")


if __name__ == "__main__":
    main()
