#!/usr/bin/env python3
"""Create an isolated, non-routed Worker config after staging identity checks."""
import json,os,pathlib,re,urllib.request
def required(name):
 v=os.environ.get(name,"").strip()
 if not v:raise SystemExit("Missing "+name)
 return v
if required("CONFIRM_STAGING_ONLY")!="STAGING_ONLY":raise SystemExit("STAGING_ONLY confirmation required")
account=required("CLOUDFLARE_ACCOUNT_ID")
staging=required("STAGING_DATABASE_ID")
production=required("PRODUCTION_DATABASE_ID")
token=required("CLOUDFLARE_API_TOKEN")
if not re.fullmatch(r"[0-9a-fA-F-]{36}",staging) or not re.fullmatch(r"[0-9a-fA-F-]{36}",production) or staging.lower()==production.lower():
 raise SystemExit("Invalid or matching D1 identities")
req=urllib.request.Request("https://api.cloudflare.com/client/v4/accounts/"+account+"/d1/database/"+staging,headers={"Authorization":"Bearer "+token})
with urllib.request.urlopen(req,timeout=20) as resp:payload=json.load(resp)
db=payload.get("result") or {}
if payload.get("success") is not True or db.get("uuid","").lower()!=staging.lower() or db.get("name")!="kindelora-payfast-d1-staging":
 raise SystemExit("Staging D1 identity mismatch")
pathlib.Path(".staging-worker").mkdir(exist_ok=True)
pathlib.Path(".staging-worker/wrangler.toml").write_text(
 'name = "kindelora-payfast-issue806-staging-only"\n'
 'main = "../staging/payfast-d1-staging-worker-entry.js"\n'
 'compatibility_date = "2026-11-23"\n'
 'workers_dev = false\n'
 'preview_urls = false\n'
 '\n[[d1_databases]]\n'
 'binding = "DB"\n'
 'database_name = "kindelora-payfast-d1-staging"\n'
 'database_id = "'+staging+'"\n')
print("PASS: exact isolated D1 identity; generated no-route staging Worker configuration")
print("NO-GO: production charging remains disabled")
