#!/usr/bin/env python3
"""Real SQLite regression of recovery migration + production SQL transaction.

Synthetic members only. No production DB, credentials, or registration mutations.
"""
import pathlib
import sqlite3
import tempfile
import threading
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIGRATION = (ROOT / 'migrations/0005_member_password_recovery.sql').read_text()


def db_open(path):
    db = sqlite3.connect(path, timeout=5, isolation_level=None)
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA busy_timeout=5000')
    return db


class RecoverySqliteTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = self.tmp.name + '/synthetic.db'
        self.db = db_open(self.path)
        self.addCleanup(self.db.close)
        self.db.executescript('''
          CREATE TABLE members(id TEXT PRIMARY KEY, email_normalized TEXT NOT NULL,
            email_verified_at TEXT, disabled_at TEXT, password_salt TEXT, password_hash TEXT);
          CREATE TABLE member_sessions(token_hash TEXT PRIMARY KEY, member_id TEXT, expires_at TEXT);
          CREATE TABLE member_login_limits(key_hash TEXT PRIMARY KEY, failures INTEGER, locked_until TEXT);
        ''')
        self.db.executescript(MIGRATION)
        self.db.execute("INSERT INTO members VALUES ('m1','synthetic@example.com','2026-01-01',NULL,'old-salt','old-hash')")
        self.db.execute("INSERT INTO member_sessions VALUES ('session','m1','2099-01-01')")
        self.db.execute("INSERT INTO member_login_limits VALUES ('login-key',5,'2099-01-01')")
        self.db.execute("INSERT INTO member_password_resets(token_hash,member_id,expires_at) VALUES ('reset-token','m1','2099-01-01')")

    def confirm(self, db, claim, now='2026-11-20T19:00:00.000Z', fail_after_claim=False):
        # Same four SQL statements and unique nonce gating as the live handler.
        db.execute('BEGIN IMMEDIATE')
        try:
            claimed = db.execute('''UPDATE member_password_resets SET consumed_at=?,consumed_nonce=?
              WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?
              AND EXISTS (SELECT 1 FROM members m WHERE m.id=member_password_resets.member_id
              AND m.email_verified_at IS NOT NULL AND m.disabled_at IS NULL)''',
              (now,claim,'reset-token',now)).rowcount
            if fail_after_claim:
                raise RuntimeError('synthetic failure before password update')
            changed = db.execute('''UPDATE members SET password_salt=?,password_hash=?
              WHERE id=(SELECT member_id FROM member_password_resets WHERE token_hash=? AND consumed_nonce=?)
              AND email_verified_at IS NOT NULL AND disabled_at IS NULL''',
              ('v2:new-salt','new-hash','reset-token',claim)).rowcount
            db.execute('''DELETE FROM member_sessions WHERE member_id=(SELECT member_id
              FROM member_password_resets WHERE token_hash=? AND consumed_nonce=?)''', ('reset-token',claim))
            db.execute('''DELETE FROM member_login_limits WHERE key_hash=? AND EXISTS
              (SELECT 1 FROM member_password_resets WHERE token_hash=? AND consumed_nonce=?)''',
              ('login-key','reset-token',claim))
            db.commit()
            return claimed,changed
        except Exception:
            db.rollback()
            raise

    def test_success_and_replay(self):
        self.assertEqual(self.confirm(self.db,'nonce-one'),(1,1))
        self.assertEqual(self.db.execute('SELECT password_hash FROM members').fetchone()[0],'new-hash')
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM member_sessions').fetchone()[0],0)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM member_login_limits').fetchone()[0],0)
        self.assertEqual(self.confirm(self.db,'nonce-two'),(0,0))

    def test_rollback_on_failure(self):
        with self.assertRaisesRegex(RuntimeError,'synthetic failure'):
            self.confirm(self.db,'failed-claim',fail_after_claim=True)
        self.assertIsNone(self.db.execute('SELECT consumed_at FROM member_password_resets').fetchone()[0])
        self.assertEqual(self.db.execute('SELECT password_hash FROM members').fetchone()[0],'old-hash')
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM member_sessions').fetchone()[0],1)

    def test_expired_and_disabled_fail_closed(self):
        self.db.execute("UPDATE member_password_resets SET expires_at='2020-01-01'")
        self.assertEqual(self.confirm(self.db,'expired'),(0,0))
        self.db.execute("UPDATE member_password_resets SET expires_at='2099-01-01'")
        self.db.execute("UPDATE members SET disabled_at='2026-01-01'")
        self.assertEqual(self.confirm(self.db,'disabled'),(0,0))

    def test_concurrent_claim_only_one_wins(self):
        outcomes=[]
        def worker(i):
            conn=db_open(self.path)
            try: outcomes.append(self.confirm(conn,'nonce-'+str(i)))
            finally: conn.close()
        threads=[threading.Thread(target=worker,args=(i,)) for i in range(2)]
        for t in threads:t.start()
        for t in threads:t.join()
        self.assertCountEqual(outcomes,[(1,1),(0,0)])
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM member_sessions').fetchone()[0],0)


if __name__ == '__main__':
    unittest.main()
