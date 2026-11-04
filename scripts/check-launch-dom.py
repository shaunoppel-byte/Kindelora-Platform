"""Static launch regressions: catch missing DOM IDs and misleading launch claims."""
from html.parser import HTMLParser
from pathlib import Path
import re
class IDs(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set(); self.duplicates=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs); value=d.get("id")
        if value:
            if value in self.ids:self.duplicates.append(value)
            self.ids.add(value)
html=Path("index.html").read_text(encoding="utf-8")
js=Path("app.js").read_text(encoding="utf-8")
p=IDs();p.feed(html)
refs=set(re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)',js))
missing=sorted(refs-p.ids)
if missing:raise SystemExit("JavaScript refers to missing HTML IDs: "+", ".join(missing))
if p.duplicates:raise SystemExit("Duplicate HTML IDs: "+", ".join(p.duplicates))
if 'billing-monthly' in js or 'billing-annual' in js:raise SystemExit("Removed billing controls referenced by script")
if 'href="/privacy.html"' not in html:raise SystemExit("Privacy information link missing")
if 'href="/terms.html"' not in html:raise SystemExit("Terms information link missing")
print(f"Validated {len(refs)} JavaScript DOM IDs and {len(p.ids)} unique HTML IDs")

# Ensure every installable/offline asset is committed before deployment.
sw=Path("sw.js").read_text(encoding="utf-8")
assets=re.search(r'const ASSETS=\[([^\]]+)\]',sw)
if not assets:raise SystemExit("PWA precache list missing")
for asset in re.findall(r'"(/[^"]+)"',assets.group(1)):
    local="index.html" if asset=="/" else asset.lstrip("/")
    if not Path(local).is_file():raise SystemExit("Missing PWA asset: "+local)
for page in ("privacy.html","terms.html"):
    if not Path(page).is_file():raise SystemExit("Missing linked policy page: "+page)
if "prefers-reduced-motion:reduce" not in html:raise SystemExit("Reduced motion accessibility rule missing")
if "scroll-margin-top" not in html:raise SystemExit("Sticky header anchor offset missing")
print("Validated offline assets, policy links and accessibility CSS")
