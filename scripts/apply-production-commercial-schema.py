import os,re,sqlite3
from pathlib import Path
if os.environ.get("CONFIRM")!="APPLY_COMMERCIAL_SCHEMA_ONLY": raise SystemExit("Explicit confirmation required")
if os.environ.get("BINDING_ID","").lower()!=os.environ.get("PRODUCTION_ID","").lower(): raise SystemExit("Verified Pages binding UUID must match production")
if not re.fullmatch(r"[0-9a-fA-F-]{40,100}",os.environ.get("RECOVERY_BOOKMARK","")): raise SystemExit("Recovery bookmark required")
# Execute the existing read-only preflight in this process before any write.
exec(compile(Path("scripts/preflight-production-commercial-schema.py").read_text(),"preflight","exec"))
sql=Path("ops/payfast-production-commercial-schema.sql").read_text()
statements=[]
buffer=""
for line in sql.splitlines(keepends=True):
 if line.lstrip().startswith("--"): continue
 buffer+=line
 if sqlite3.complete_statement(buffer):
  statement=buffer.strip()
  buffer=""
  if statement.upper()=="PRAGMA FOREIGN_KEYS = ON;": continue
  if not re.match(r"CREATE (?:TABLE|INDEX) IF NOT EXISTS\s+(?:plus_|idx_plus_)",statement,re.I): raise SystemExit("Unexpected SQL statement")
  statements.append(statement)
if buffer.strip() or not statements: raise SystemExit("Incomplete migration")
# Only additive, reviewed DDL. No automatic restore on failure.
for statement in statements: query(statement)
exec(compile(Path("scripts/preflight-production-commercial-schema.py").read_text(),"postflight","exec"))
actual_names={r["name"] for r in query("SELECT name FROM sqlite_master WHERE type IN ('table','index')")}
if not set(expected)<=actual_names: raise SystemExit("Post-migration schema incomplete")
if query("PRAGMA foreign_key_check"): raise SystemExit("Foreign key integrity check failed; keep charging disabled")
print("PASS: commercial schema applied and verified; charging remains disabled")
