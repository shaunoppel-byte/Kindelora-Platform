#!/usr/bin/env python3
"""Read-only preflight for a dedicated staging Worker deployment. No Worker writes."""
import json,os,re,sys,urllib.request,urllib.error

def fail(message):
    raise SystemExit("WORKERS STAGING PREFLIGHT FAILED: "+message)
def required(name):
    value=os.environ.get(name,"").strip()
    if not value:fail("missing "+name)
    return value
if required("CONFIRM_STAGING_ONLY")!="STAGING_ONLY":fail("STAGING_ONLY confirmation required")
account=required("CLOUDFLARE_ACCOUNT_ID")
token=required("CLOUDFLARE_API_TOKEN")
staging=required("STAGING_DATABASE_ID")
production=required("PRODUCTION_DATABASE_ID")
if staging.lower()==production.lower():fail("staging and production IDs match")
if not all(re.fullmatch(r"[0-9a-fA-F-]{36}",v) for v in (staging,production)):fail("invalid D1 IDs")
root="https://api.cloudflare.com/client/v4/accounts/"+account
def get(path):
    req=urllib.request.Request(root+path,headers={"Authorization":"Bearer "+token,"Accept":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=25) as response:return json.load(response)
    except urllib.error.HTTPError as e:
        if e.code in (401,403):fail("Cloudflare denied Workers read access (HTTP "+str(e.code)+"); token needs Workers Scripts permission")
        fail("Cloudflare request failed HTTP "+str(e.code))
    except urllib.error.URLError:fail("Cloudflare request failed; check connectivity")
db=get("/d1/database/"+staging)
if db.get("success") is not True or db.get("result",{}).get("uuid","").lower()!=staging.lower() or db.get("result",{}).get("name")!="kindelora-payfast-d1-staging":
    fail("D1 staging identity mismatch")
print("PASS: staging D1 identity verified, distinct from production")
workers=get("/workers/scripts")
if workers.get("success") is not True:fail("Workers scripts listing not authorized")
print("PASS: Workers scripts read permission verified; no deployment attempted")
print("NOTE: successful read access does not prove Workers Scripts Edit permission")
print("NO-GO: Worker deployment, D1 batch tests and charging not executed")
