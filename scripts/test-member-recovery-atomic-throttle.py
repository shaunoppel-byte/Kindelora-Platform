#!/usr/bin/env python3
"""Execute the actual recovery throttle UPSERT against SQLite under contention."""
import pathlib
import re
import sqlite3
import tempfile
import threading
import unittest

ROOT=pathlib.Path(__file__).resolve().parent.parent
source=(ROOT/'functions/api/member/request-password-reset.js').read_text()
match=re.search(r'const limit=await env.DB.prepare\(\x60(INSERT INTO member_password_reset_limits[\s\S]*?RETURNING attempts,blocked_until)\x60\)',source)
if not match: raise RuntimeError('Atomic throttle SQL missing from handler')
SQL=match.group(1)

class ThrottleTest(unittest.TestCase):
 def test_concurrent_requests_limit_to_three(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=tmp+'/throttle.db'
   db=sqlite3.connect(path)
   db.execute('PRAGMA journal_mode=WAL')
   db.execute('CREATE TABLE member_password_reset_limits(key_hash TEXT PRIMARY KEY,attempts INTEGER NOT NULL,window_started_at TEXT NOT NULL,blocked_until TEXT)')
   db.commit();db.close()
   outcomes=[];errors=[]
   def worker():
    con=sqlite3.connect(path,timeout=10)
    try:
     row=con.execute(SQL,('same-key','2026-11-20T19:00:00Z','2026-11-20T19:00:00Z','2026-11-20T18:00:00Z','2026-11-20T18:00:00Z','2026-11-20T19:00:00Z','2026-11-20T18:00:00Z','2026-11-20T20:00:00Z')).fetchone()
     con.commit();outcomes.append(row[0])
    except Exception as e:errors.append(str(e))
    finally:con.close()
   threads=[threading.Thread(target=worker) for _ in range(8)]
   for thread in threads:thread.start()
   for thread in threads:thread.join()
   self.assertFalse(errors,errors)
   self.assertEqual(sorted(outcomes),[1,2,3,4,4,4,4,4])
   db=sqlite3.connect(path)
   self.assertEqual(db.execute('SELECT blocked_until FROM member_password_reset_limits').fetchone()[0],'2026-11-20T20:00:00Z')
   db.close()

if __name__=='__main__':unittest.main()
