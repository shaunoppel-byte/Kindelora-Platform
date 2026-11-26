import os,json,re,sqlite3,urllib.request
from pathlib import Path
def need(k):
 v=os.environ.get(k,"").strip()
 if not v: raise SystemExit("Missing "+k)
 return v
required_settings={"ACCOUNT_ID":"secret KINDELORA_D1_PRODUCTION_ACCOUNT_ID","API_TOKEN":"secret KINDELORA_D1_PRODUCTION_READ_TOKEN","PRODUCTION_ID":"variable KINDELORA_D1_PRODUCTION_DATABASE_ID","STAGING_ID":"variable KINDELORA_D1_STAGING_DATABASE_ID","PRODUCTION_NAME":"variable KINDELORA_D1_PRODUCTION_DATABASE_NAME"}
missing=[label for key,label in required_settings.items() if not os.environ.get(key,"").strip()]
if missing:
 for label in missing: print("MISSING CONFIGURATION: "+label)
 raise SystemExit("Configure all listed settings in payfast-d1-production; no Cloudflare request attempted")
account=need("ACCOUNT_ID")
prod=need("PRODUCTION_ID")
stage=need("STAGING_ID")
name=need("PRODUCTION_NAME")
token=need("API_TOKEN")
uuid_pattern=r"[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}"
errors=[]
if not re.fullmatch(r"[a-fA-F0-9]{32}",account): errors.append("ACCOUNT_ID must be 32 hexadecimal characters")
if not re.fullmatch(uuid_pattern,prod): errors.append("PRODUCTION_ID must be a full database UUID")
if not re.fullmatch(uuid_pattern,stage): errors.append("STAGING_ID must be a full database UUID")
if prod.lower()==stage.lower(): errors.append("Production and staging IDs must differ")
if "stag" in name.lower(): errors.append("PRODUCTION_NAME contains staging marker")
if errors:
 for error in errors: print("INVALID CONFIGURATION: "+error)
 raise SystemExit("Identity validation failed; no Cloudflare request attempted")
base=f"https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{prod}"
def api(path,sql=None):
 req=urllib.request.Request(base+path,data=None if sql is None else json.dumps({"sql":sql}).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=30) as response: result=json.load(response)
 if not result.get("success"): raise SystemExit("API rejected read-only request")
 return result["result"]
identity=api("")
if identity.get("uuid","").lower()!=prod.lower() or identity.get("name")!=name: raise SystemExit("Production identity mismatch")
def query(sql):
 result=api("/query",sql)
 if not result[0].get("success"): raise SystemExit("Schema query failed")
 return result[0]["results"]
db=sqlite3.connect(":memory:")
db.executescript(Path("ops/payfast-production-commercial-schema.sql").read_text())
expected=dict(db.execute("SELECT name,sql FROM sqlite_master WHERE type IN ('table','index') AND sql IS NOT NULL"))
actual={r["name"]:r["sql"] for r in query("SELECT name,sql FROM sqlite_master WHERE type IN ('table','index') AND sql IS NOT NULL")}
def norm(s):
 # The executor strips standalone SQL comments; SQLite may retain them in stored DDL.
 s=re.sub(r"(?m)^\s*--[^\n]*$", "", s)
 return re.sub(r"\s+","",s.replace("IF NOT EXISTS","")).lower()
assert norm("CREATE TABLE t (\n -- documentation\n id TEXT)") == norm("CREATE TABLE t (id TEXT)")
assert norm("CREATE TABLE t (id TEXT NOT NULL)") != norm("CREATE TABLE t (id TEXT)")
if not {"members","member_sessions"} <= actual.keys(): raise SystemExit("Existing member schema absent")
for k,v in expected.items():
 if k not in actual: print("MISSING:",k)
 elif norm(v)!=norm(actual[k]): raise SystemExit("Existing schema differs: "+k)
 else: print("MATCH:",k)
print("PASS: read-only schema comparison; backup and Pages binding still require independent verification")

# Read-only integrity verification, without exposing customer records.
missing_objects=set(expected)-set(actual)
if missing_objects: raise SystemExit("Commercial schema incomplete")
if query("PRAGMA foreign_key_check"): raise SystemExit("Foreign key integrity violations detected")
print("PASS: all commercial objects present and foreign key integrity verified")
