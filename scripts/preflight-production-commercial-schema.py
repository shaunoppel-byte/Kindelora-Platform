import os,json,re,sqlite3,urllib.request
from pathlib import Path
def need(k):
 v=os.environ.get(k,"").strip()
 if not v: raise SystemExit("Missing "+k)
 return v
account=need("ACCOUNT_ID")
prod=need("PRODUCTION_ID")
stage=need("STAGING_ID")
name=need("PRODUCTION_NAME")
token=need("API_TOKEN")
if not re.fullmatch(r"[a-fA-F0-9]{32}",account) or any(not re.fullmatch(r"[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}",x) for x in (prod,stage)) or prod.lower()==stage.lower() or "stag" in name.lower(): raise SystemExit("Invalid production identity")
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
def norm(s): return re.sub(r"\s+","",s.replace("IF NOT EXISTS","")).lower()
if not {"members","member_sessions"} <= actual.keys(): raise SystemExit("Existing member schema absent")
for k,v in expected.items():
 if k not in actual: print("MISSING:",k)
 elif norm(v)!=norm(actual[k]): raise SystemExit("Existing schema differs: "+k)
 else: print("MATCH:",k)
print("PASS: read-only schema comparison; backup and Pages binding still require independent verification")
