#!/usr/bin/env python3
"""Conservative R0 cost-risk check: flag billing config and paid package references for review."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
patterns={
 "billing token or payment card configuration":re.compile(r"(?i)(?:STRIPE_SECRET_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|BILLING_ACCOUNT_ID)\s*[:=]"),
 "paid deployment plan declaration":re.compile(r"(?i)(?:plan|tier)\s*[:=]\s*['\"](?:pro|business|enterprise|paid)['\"]"),
}
suffixes={".toml",".json",".jsonc",".yaml",".yml",".env"}
excluded={".git","node_modules","dist","build",".next","coverage","vendor"}
issues=[]
for file in root.rglob("*"):
 if not file.is_file() or file.suffix.lower() not in suffixes or any(x in excluded for x in file.parts):continue
 if file.name.endswith(".lock") or file.name in {"package-lock.json","pnpm-lock.yaml","yarn.lock"}:continue
 if "docs" in file.parts or "tests" in file.parts:continue
 try: data=file.read_text(encoding="utf-8")
 except (UnicodeError,OSError):continue
 for label,pattern in patterns.items():
  for match in pattern.finditer(data):
   issues.append((file.relative_to(root),label,data.count("\n",0,match.start())+1))
if issues:
 for file,label,line in issues:print(f"R0 REVIEW REQUIRED: {file}:{line}: {label}")
 print("Check that any referenced service is free and approved. Do not commit credentials.")
 sys.exit(1)
print("R0 guard passed: no obvious paid-plan or billing-secret configuration patterns detected. This is not a billing audit.")
