#!/usr/bin/env python3
"""Read-only production registration smoke check; never sends registration requests."""
import json
import sys
import urllib.error
import urllib.request

BASE = "https://kindelora.pages.dev"
PATHS = ("/api/member/registration-config", "/plus-account.html", "/plus-account.js")
def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "KINDELORA-read-only-smoke/1.0", "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.status, response.read(300_000).decode("utf-8")

def main():
    try:
        code, raw = get(PATHS[0])
        assert code == 200, "Registration configuration endpoint must return 200"
        config = json.loads(raw)
        assert isinstance(config.get("available"), bool), "Registration availability must be boolean"
        assert "turnstileSecretKey" not in config and "TURNSTILE_SECRET_KEY" not in raw, "Secret leaked"
        if config["available"]:
            # A public registration-ready response requires a separate controlled E2E approval.
            print("WARNING: Public registration is enabled. Manual production E2E and security approval required.")
            assert isinstance(config.get("turnstileSiteKey"), str) and len(config["turnstileSiteKey"]) >= 8
        else:
            assert "turnstileSiteKey" not in config, "Fail-closed config should not disclose site key"
        code, html = get(PATHS[1])
        assert code == 200 and 'id="registration-submit"' in html, "Deployed signup HTML missing"
        assert 'disabled title="Email verification is being configured"' in html, "Signup not disabled by default"
        assert "Checkout coming soon" in html, "Checkout release guard absent"
        code, js = get(PATHS[2])
        assert code == 200 and "/api/member/registration-request" in js, "Deployed registration JS missing"
        print("PASS: production read-only registration contract; registration_available=" + str(config["available"]).lower())
    except (urllib.error.URLError, ValueError, AssertionError) as exc:
        print("FAIL: " + str(exc), file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
