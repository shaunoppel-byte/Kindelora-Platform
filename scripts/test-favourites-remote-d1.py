import os,json,urllib.request,uuid,re
from pathlib import Path
account,token,stage,prod=[os.environ[k] for k in ("ACCOUNT_ID","API_TOKEN","STAGING_ID","PRODUCTION_ID")]
assert re.fullmatch(r"[0-9a-f]{32}",account) and token
assert stage!=prod and all(re.fullmatch(r"[0-9a-f-]{36}",x) for x in (stage,prod))
prefix="p0fav_"+uuid.uuid4().hex[:16]
members=prefix+"_members"
fav=prefix+"_favourites"
def query(sql,params=[]):
    req=urllib.request.Request(f"https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{stage}/query",data=json.dumps({"sql":sql,"params":params}).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"})
    with urllib.request.urlopen(req,timeout=30) as response: data=json.load(response)
    assert data["success"] and all(x["success"] for x in data["result"])
    return data["result"][0]["results"]
try:
    query(f"CREATE TABLE {members}(id TEXT PRIMARY KEY)")
    schema=Path("schema/member-favourites-staged.sql").read_text().replace("member_favourites",fav).replace("REFERENCES members",f"REFERENCES {members}")
    query(schema)
    query(f"INSERT INTO {members} VALUES ('a'),('b')")
    sql=f"INSERT OR IGNORE INTO {fav}(member_id,kind,content,created_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM {fav} WHERE member_id=?)<100"
    for member in ("a","a","b"): query(sql,[member,"messages","same","2026-11-27",member])
    assert query(f"SELECT COUNT(*) AS n FROM {fav}")[0]["n"]==2
    query(f"DELETE FROM {fav} WHERE member_id=? AND kind=? AND content=?",["a","messages","same"])
    assert query(f"SELECT member_id FROM {fav}")==[{"member_id":"b"}]
    query(f"DELETE FROM {members} WHERE id='b'")
    assert query(f"SELECT COUNT(*) AS n FROM {fav}")[0]["n"]==0
    print("PASS: remote staging D1 fixture, duplicate prevention, account isolation and cascade")
finally:
    try: query(f"DROP TABLE IF EXISTS {fav}")
    finally: query(f"DROP TABLE IF EXISTS {members}")
