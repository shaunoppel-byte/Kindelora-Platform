# My KINDELORA + Special Moments — Product and Release Specification

**Status:** Founder approved; implementation gated. **Tracking:** #698. **Promise:** Never miss a special moment again.

## Emotional promise
Every interaction must feel welcoming, sincere, uplifting, unhurried, and respectful. Never fabricate personal familiarity. Invite rather than pressure. Users control whether they save dates, receive reminders, or share cards.

## Information architecture
My KINDELORA → Profile · Special Moments · My Cards · Reminder Preferences · Privacy & Data Controls.

## MVP journeys
1. Sign in → My KINDELORA → optional preferred name → warm, verified personalised welcome.
2. Add an occasion → choose birthday or anniversary → optional nickname, month and day → save privately → edit/delete.
3. Preview a premium card → optionally personalise a message → download/share manually. No automatic third-party messages.
4. Opt into reminders → choose offsets, timezone and channel → pause/delete at any time.
5. Sign out → warm farewell, verified identity only; never hardcode a person's name in imagery.

## Design quality
Mobile-first, calm cream/plum/gold, legible contrast, touch targets >=44px, keyboard support, reduced motion, meaningful loading and error states, editorially reviewed copy. Never use guilt or dark patterns to drive subscriptions.

## Privacy by design
Collect minimum data; day/month rather than full DOB where possible. No gender requirement, age inference, relationship-status inference, third-party contact information, or identifiable child records in MVP. Confirm POPIA lawful basis, privacy notices, retention, access, deletion, processor and international transfer obligations before enabling production collection. Reminders are opt-in and distinct from marketing.

## Technical release gates
Preserve existing member authentication, registration, and PayFast workflows. Validate server-side member ownership on every read/write, protect against CSRF and XSS, verify session expiry, use additive migrations with backup and rollback. Do not merge unverified changes. Include migration readiness and staging QA.

## Platinum 9.5+ release scorecard
Score warmth, design, navigation, accessibility, personalisation/privacy, reliability, and content/card quality separately. Require 9.5+/10 for each dimension based on evidence, plus all critical functional/security tests passing. Collect real-device user feedback before claiming Platinum Standard achieved.

## Dependencies
#695 navigation; #696 authentic welcome/farewell; #697 preferred-name foundation. Their existence does not mean they are deployed.
