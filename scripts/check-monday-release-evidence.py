#!/usr/bin/env python3
"""Fail-closed prepublication evidence gate. Static evidence validation only; never proves live behavior."""
import json
import sys
from datetime import datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
path = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "quality/monday-release-evidence.json")
evidence = json.loads(path.read_text(encoding="utf-8"))
registry = json.loads((ROOT / "content/motivational-monday-registry.json").read_text(encoding="utf-8"))
errors = []
def check(ok, message):
    if not ok: errors.append(message)
check(evidence.get("decision") == "GO", "No explicit GO decision")
check(bool(evidence.get("reviewer")), "No named reviewer")
check(bool(evidence.get("decision_timestamp_utc")), "No UTC decision timestamp")
check(bool(evidence.get("exact_commit_sha")) and len(str(evidence.get("exact_commit_sha", ""))) == 40, "Missing full commit SHA")
check(registry.get("historical_archive_complete") is True, "Historical uniqueness archive incomplete")
target = next((m for m in registry.get("messages", []) if m.get("id") == evidence.get("edition_id")), None)
check(target is not None, "Edition ID absent from editorial registry")
if target:
    check(target.get("editorial_status") == "approved", "Edition editorial status not approved")
    check(bool(target.get("reviewer") and target.get("approved_at")), "Edition lacks recorded editorial approval")
    check(target.get("publication_status") in ("approved_for_release", "published"), "Edition not approved for release")
for gate in ("editorial_uniqueness", "quote_attribution", "script_audio_match", "mp3_playback_mobile", "mp3_playback_desktop", "audio_duration", "mobile_layout", "accessibility", "links_pwa_cache", "plus_server_auth", "guest_denial", "free_denial", "expired_denial", "regression_ci", "rollback", "production_readiness"):
    item = evidence.get("gates", {}).get(gate, {})
    check(item.get("result") == "pass" and bool(item.get("evidence_url")) and bool(item.get("verified_by")), "Missing verified PASS: " + gate)
check(bool(evidence.get("sunday_1500_qa_timestamp_sast")), "Sunday 15:00 QA milestone not evidenced")
check(bool(evidence.get("sunday_2000_decision_timestamp_sast")), "Sunday 20:00 decision milestone not evidenced")
print(json.dumps({"decision":"GO" if not errors else "NO-GO", "edition":evidence.get("edition_id"), "failed_checks":errors}, indent=2))
sys.exit(bool(errors))
