#!/usr/bin/env python3
"""Generate staging-only Wrangler remote preview config, never production."""
import json,os,pathlib,re,urllib.request
def required(k):
 v=os.environ.get(k,"").strip()
 if not v:raise SystemExit("Missing "+k)
 return v
if required("CONFIRM_STAGING_ONLY")!="STAGING_ONLY":raise SystemExit("Missing staging confirmation")
account=required("CLOUDFLARE_ACCOUNT_ID"); token=required("CLOUDFLARE_API_TOKEN")
staging=required("STAGING_DATABASE_ID"); production=required("PRODUCTION_DATABASE_ID")
if staging.lower()==production.lower() or not all(re.fullmatch(r"[0-9a-fA-F-]{36}",v) for v in [staging,production]):
 raise SystemExit("Invalid staging/production D1 IDs")
req=urllib.request.Request("https://api.cloudflare.com/client/v4/accounts/"+account+"/d1/database/"+staging,headers={"Authorization":"Bearer "+token})
with urllib.request.urlopen(req,timeout=20) as r:body=json.load(r)
db=body.get("result") or {}
if body.get("success") is not True or db.get("uuid","").lower()!=staging.lower() or db.get("name")!="kindelora-payfast-d1-staging":
 raise SystemExit("Staging D1 identity mismatch")
pathlib.Path(".staging-worker").mkdir(exist_ok=True)
pathlib.Path(".staging-worker/wrangler-test.toml").write_text(
 'name = "kindelora-payfast-issue806-staging-only"\n'
 'main = "../staging/payfast-d1-worker-test-entry.js"\n'
 'compatibility_date = "2026-11-23"\n'
 'workers_dev = false\npreview_urls = false\n'
 '\n[vars]\nISSUE806_STAGING_ONLY = "STAGING_ONLY"\n'
 '\n[[d1_databases]]\nbinding = "DB"\n'
 'database_name = "kindelora-payfast-d1-staging"\n'
 'database_id = "'+staging+'"\n')
print("PASS: isolated staging D1 identity verified; private remote-preview config prepared")
