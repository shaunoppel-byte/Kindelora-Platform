#!/usr/bin/env python3
"""Read-only recovery migration preflight for a Cloudflare D1 schema-only JSON export.

Usage: python3 scripts/check-member-recovery-d1-preflight.py schema.json
Obtain schema separately using a READ-ONLY Cloudflare D1 sqlite_master query.
Never supply member records, credentials, tokens or private database dumps.
This tool NEVER connects to D1, migrates, or prints secrets.
"""
import json
import pathlib
import sys

REQUIRED_BASE={'members','member_sessions','member_login_limits'}
RECOVERY={'member_password_resets','member_password_reset_limits'}

def names(payload):
    if isinstance(payload,dict) and isinstance(payload.get('results'),list):
        rows=payload['results']
    elif isinstance(payload,list) and payload and isinstance(payload[0],dict) and 'results' in payload[0]:
        rows=payload[0]['results']
    else:
        raise ValueError('Expected Cloudflare D1 read-only query JSON results')
    if not isinstance(rows,list):raise ValueError('Invalid query results')
    return {r['name'] for r in rows if isinstance(r,dict) and r.get('type')=='table' and isinstance(r.get('name'),str)}

def assess(tables):
    missing=sorted(REQUIRED_BASE-tables)
    existing=sorted(RECOVERY & tables)
    if missing:return 'NO-GO: required member auth tables missing: '+', '.join(missing)
    if existing and len(existing)!=len(RECOVERY):return 'NO-GO: partial recovery schema; investigate before migration'
    if len(existing)==len(RECOVERY):return 'REVIEW: recovery tables already present; verify column/index compatibility and migration history; do not reapply blindly'
    return 'PRECHECK ONLY: base tables present; recovery tables absent. Backup, columns, indexes, FK and operator approval still required before migration.'

if __name__=='__main__':
    if len(sys.argv)!=2:
        print('Usage: python3 scripts/check-member-recovery-d1-preflight.py schema.json',file=sys.stderr);sys.exit(2)
    try:
        p=pathlib.Path(sys.argv[1]);data=json.loads(p.read_text(encoding='utf-8'))
        if p.stat().st_size>500000:raise ValueError('Only a small schema-only JSON export is accepted')
        print(assess(names(data)))
    except (OSError,ValueError,KeyError,TypeError) as exc:
        print('NO-GO: unable to validate schema-only export ('+type(exc).__name__+')',file=sys.stderr);sys.exit(1)
