import os,json,urllib.request,re
from pathlib import Path
account,token,prod,stage,binding,confirm,bookmark,name=[os.environ[k] for k in ("ACCOUNT_ID","API_TOKEN","PRODUCTION_ID","STAGING_ID","BINDING_ID","CONFIRM","RECOVERY_BOOKMARK","PRODUCTION_NAME")]
assert confirm=="APPLY FAVOURITES ONLY"
assert prod==binding and prod!=stage and all(re.fullmatch(r"[0-9a-f-]{36}",x) for x in (prod,stage))
assert re.fullmatch(r"[0-9a-f]{32}",account) and token and name and len(bookmark)>20
base=f"https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{prod}"
headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"}
def request(url,data=None):
    with urllib.request.urlopen(urllib.request.Request(url,data=data,headers=headers),timeout=30) as response: result=json.load(response)
    assert result["success"]
    return result["result"]
def query(sql):
    result=request(base+"/query",json.dumps({"sql":sql}).encode())
    assert all(x["success"] for x in result)
    return result[0]["results"]
assert request(base)["name"]==name
assert any(x["name"]=="id" and x["pk"]==1 for x in query("PRAGMA table_info(members)"))
assert not query("PRAGMA foreign_key_check")
schema=Path("schema/member-favourites-staged.sql").read_text()
existing=query("SELECT sql FROM sqlite_master WHERE type='table' AND name='member_favourites'")
if not existing: query(schema)
columns=query("PRAGMA table_info(member_favourites)")
assert [(x["name"],x["pk"],x["notnull"]) for x in columns]==[("member_id",1,1),("kind",2,1),("content",3,1),("created_at",0,1)]
fk=query("PRAGMA foreign_key_list(member_favourites)")
assert len(fk)==1 and fk[0]["table"]=="members" and fk[0]["from"]=="member_id" and fk[0]["to"]=="id" and fk[0]["on_delete"]=="CASCADE"
assert not query("PRAGMA foreign_key_check")
print("PASS: additive favourites schema and foreign key integrity; no member or payment records modified")
