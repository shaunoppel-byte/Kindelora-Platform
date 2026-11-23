#!/usr/bin/env python3
"""Issue #806: guarded, staging-only Cloudflare D1 schema setup. Never touches production."""
import json, os, pathlib, re, sqlite3, sys, urllib.error, urllib.request

def fail(message):
    raise SystemExit("STAGING GATE FAILED: " + message)

def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        fail("missing " + name)
    return value

if required("CONFIRM_STAGING_ONLY") != "STAGING_ONLY":
    fail("explicit STAGING_ONLY confirmation required")
token = required("CLOUDFLARE_API_TOKEN")
account = required("CLOUDFLARE_ACCOUNT_ID")
staging = required("STAGING_DATABASE_ID")
production = required("PRODUCTION_DATABASE_ID")
expected_name = "kindelora-payfast-d1-staging"
if staging.lower() == production.lower():
    fail("production and staging database IDs match")
uuid = re.compile(r"^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$", re.I)
if not uuid.fullmatch(staging) or not uuid.fullmatch(production):
    fail("invalid D1 database UUID")
base = "https://api.cloudflare.com/client/v4/accounts/" + account + "/d1/database/" + staging

def api(path, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(base + path, data=data,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json",
                 "Accept": "application/json"}, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        fail("Cloudflare API request failed (" + type(error).__name__ + "); check staging-only token permissions")
    if result.get("success") is not True:
        fail("Cloudflare rejected staging request; inspect API token permissions")
    return result["result"]

identity = api("")
if identity.get("uuid", "").lower() != staging.lower() or identity.get("name") != expected_name:
    fail("staging database identity/name mismatch")
print("PASS: verified dedicated staging database name and UUID, distinct from production")

def query(sql):
    results = api("/query", {"sql": sql})
    if not isinstance(results, list) or not results or results[0].get("success") is not True:
        fail("D1 SQL statement failed (statement text withheld)")
    return results[0].get("results", [])

existing = query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
# Cloudflare's own _cf_KV and SQLite's sqlite_* tables do not represent application data.
# Fail closed for every other table, but print its name so operators can diagnose
# an unexpectedly populated staging database without exposing any row contents.
if not isinstance(existing, list) or any(not isinstance(row, dict) or not isinstance(row.get("name"), str) for row in existing):
    fail("unexpected D1 table inventory response; refusing schema setup")
application_tables = sorted(row["name"] for row in existing
    if row["name"] != "_cf_KV" and not row["name"].startswith("sqlite_"))
print("INFO: staging table inventory: " + ", ".join(row["name"] for row in existing))
if application_tables:
    fail("staging contains application tables: " + ", ".join(application_tables) + "; refusing schema setup")
print("PASS: isolated staging database has no application tables (Cloudflare _cf_KV allowed)")

names = ["0001_plus_persistence.sql", "20261123_plus_payfast_recurring_linkage.sql",
         "20261123_plus_payfast_renewal_atomic_guard.sql"]
for name in names:
    content = (pathlib.Path("migrations") / name).read_text()
    statements, buffer = [], ""
    for line in content.splitlines(keepends=True):
        buffer += line
        if sqlite3.complete_statement(buffer):
            statement = buffer.strip()
            if statement:
                statements.append(statement)
            buffer = ""
    if buffer.strip():
        fail("incomplete migration: " + name)
    for statement in statements:
        query(statement)
    print("PASS: applied staging migration " + name + " (" + str(len(statements)) + " statements)")

tables = {row["name"] for row in query("SELECT name FROM sqlite_master WHERE type='table'")}
expected = {"plus_customers", "plus_orders", "plus_payment_events", "plus_subscriptions",
            "plus_payfast_recurring_links", "plus_payfast_renewal_events",
            "plus_payfast_renewal_atomic_guard"}
if not expected.issubset(tables):
    fail("staging schema verification failed")
print("PASS: all seven required staging tables verified")
print("NO-GO: no renewal transactions, PayFast calls or production changes executed")
