import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../migrations/0005_member_password_recovery.sql',import.meta.url),'utf8');
test('recovery migration creates purpose-scoped reset records and independent throttle',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS member_password_resets/i);
 assert.match(sql,/token_hash TEXT PRIMARY KEY NOT NULL/i);
 assert.match(sql,/member_id TEXT NOT NULL/i);
 assert.match(sql,/expires_at TEXT NOT NULL/i);
 assert.match(sql,/consumed_at TEXT/i);
 assert.match(sql,/consumed_nonce TEXT/i);
 assert.match(sql,/FOREIGN KEY\(member_id\) REFERENCES members\(id\)/i);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS member_password_reset_limits/i);
 assert.match(sql,/window_started_at TEXT NOT NULL/i);
 assert.match(sql,/blocked_until TEXT/i);
});
test('migration never changes existing auth or payment tables',()=>{
 assert.doesNotMatch(sql,/\b(?:ALTER|DROP|UPDATE|DELETE|INSERT|REPLACE)\b/i);
 assert.doesNotMatch(sql,/CREATE TABLE IF NOT EXISTS (?:members|member_sessions|member_email_verifications|member_login_limits)\b/i);
});
