#!/usr/bin/env python3
"""Zero-dependency static contract checks for the Motivational Monday release."""
from html.parser import HTMLParser
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "motivational-monday.html"
HOME = ROOT / "index.html"
MANIFEST = ROOT / "manifest.webmanifest"
REGISTRY = ROOT / "content/motivational-monday-registry.json"

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.images = []
        self.headings = []
        self.buttons = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        if tag == "a":
            self.links.append(a.get("href", ""))
        if tag == "img":
            self.images.append(a)
        if tag in ("h1", "h2", "h3"):
            self.headings.append(tag)
        if tag == "button":
            self.buttons.append(a)

def check(condition, message, errors):
    if not condition:
        errors.append(message)

def main():
    errors = []
    page_text = PAGE.read_text(encoding="utf-8")
    home_text = HOME.read_text(encoding="utf-8")
    page = Parser()
    page.feed(page_text)
    check(len(page.ids) == len(set(page.ids)), "Duplicate HTML IDs on Monday page", errors)
    check(page.headings.count("h1") == 1, "Expected exactly one H1", errors)
    check("weekly-message" in page.ids, "Missing featured message anchor", errors)
    check("/#membership" in page.links, "Missing PLUS membership link", errors)
    check("/affirmation-library.html" in page.links, "Missing affirmation library navigation", errors)
    check("motivational-monday.html" in home_text, "Homepage must link to Monday product", errors)
    check("Motivational Monday" in home_text, "Homepage product identity missing", errors)
    check(all(i.get("alt") is not None for i in page.images), "Image missing alt attribute", errors)
    check(all(b.get("type") == "button" for b in page.buttons), "Button type must be explicit", errors)
    check("prefers-reduced-motion" in page_text, "Reduced-motion support missing", errors)
    check('class="skip-link" href="#main-content"' in page_text, "Keyboard skip-to-content link missing", errors)
    check('<main id="main-content" tabindex="-1">' in page_text, "Keyboard focus target missing", errors)
    check('aria-label="Message actions"' in page_text, "Message action group needs accessible label", errors)
    check("aria-live" in page_text, "Status announcements missing", errors)
    check("speechSynthesis" in page_text, "Narration capability missing", errors)
    check("navigator.share" in page_text, "Native sharing capability missing", errors)
    check("messageText=document.getElementById(\'message-text\').innerText.trim()" in page_text, "Share fallback must include full featured message, not teaser", errors)
    check("planned" in page_text.lower(), "Planned PLUS features must be disclosed", errors)
    check("Carpe Diem!" in page_text, "Editorial signature missing", errors)
    check("A new message<br>every Monday" not in page_text, "Do not promise automated weekly publishing before it is operational", errors)
    check("This week\'s featured reflection" not in page_text, "Undated featured preview must not imply a current weekly publication", errors)
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    messages = registry.get("messages", [])
    check(len(messages) > 0, "Editorial registry must not be empty", errors)
    ids = [m.get("id") for m in messages]
    check(len(ids) == len(set(ids)), "Duplicate editorial message IDs", errors)
    required = ("title", "theme", "emotional_takeaway", "narrative_structure", "quote", "quote_attribution", "editorial_status", "publication_status")
    for item in messages:
        check(all(item.get(k) for k in required), f"Incomplete editorial metadata: {item.get('id')}", errors)
        if item.get("publication_status") == "published":
            check(item.get("editorial_status") == "approved", f"Published message lacks editorial approval: {item.get('id')}", errors)
            check(bool(item.get("reviewer") and item.get("approved_at")), f"Published message lacks approval record: {item.get('id')}", errors)
            check(registry.get("historical_archive_complete") is True, "Do not publish while historical archive is incomplete", errors)
    titles = [m.get("title", "").casefold().strip() for m in messages]
    quotes = [m.get("quote", "").casefold().strip() for m in messages]
    check(len(titles) == len(set(titles)), "Duplicate editorial titles", errors)
    check(len(quotes) == len(set(quotes)), "Repeated quotation in editorial registry", errors)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    check(manifest.get("scope") == "/", "PWA manifest scope must include Monday page", errors)
    for target in ("/icon.svg", "/affirmation-library.html", "/contact.html"):
        check((ROOT / target.lstrip("/")).is_file(), f"Missing local navigation target: {target}", errors)
    if errors:
        for error in errors:
            print("FAIL:", error)
        return 1
    print("PASS: Motivational Monday static contract (not browser, accessibility or production validation)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
