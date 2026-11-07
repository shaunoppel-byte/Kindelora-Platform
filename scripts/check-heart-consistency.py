"""Check KINDELORA's consistent, accessible heart UI and subscription gate."""
from pathlib import Path
import re
import json
gallery_count=4  # Three committed photographic PNG cards and one scenic free card
html=Path("index.html").read_text()
js=Path("member-favourites.js").read_text()
css=Path("member-favourites.css").read_text()
assert html.count('class="heart-save')==3 + gallery_count, "Expected three non-gallery hearts and one per published gallery card"
assert html.count('class="heart-save gallery-heart"')==gallery_count, "Each free gallery card must offer a Plus-gated heart"
assert html.count('data-heart-type="affirmation"')==1 + gallery_count, "Affirmation hearts must use the affirmation collection gate"
assert 'data-heart-type="affirmation"' in html, "Affirmation heart must have distinct collection type"
assert 'id="member-tab-messages"' in js and 'id="member-tab-affirmations"' in js
assert 'selectCollection("affirmations",false)' in js and 'selectCollection("messages",false)' in js
assert html.count('data-heart="moment"')==2 and 'data-heart="daily"' in html
assert html.count('class="symbol heart-symbol"')==2, "Plus hearts must use standard SVG"
assert not re.search(r'<div class="symbol" aria-hidden="true">[♥♡]</div>',html)
assert 'class="member-gate-heart" aria-hidden="true"><svg' in js
assert 'class="member-gate-heart" aria-hidden="true">♥' not in js
assert 'createElementNS("http://www.w3.org/2000/svg","svg")' in js
assert 'button.classList.contains("heart-save")' in js
assert 'button.setAttribute("aria-pressed","false")' in js
assert 'member-favourites-gate' in js and 'Explore KINDELORA Plus' in js
assert 'Never claim a visitor is subscribed' in js
assert '.heart-save[aria-pressed="true"] svg{fill:#c62d50' in css
assert '.daily-message .heart-save{position:relative' in css
assert '#favourites[hidden]{display:none!important}' in css
assert '<section id="favourites" class="soft" hidden>' in html
print("Heart UI consistency and gating source checks passed")
