// Zero-dependency read-only verification of a Cloudflare D1 SQL response.
// Pipe the JSON result of: wrangler d1 execute <DB_NAME> --remote --command
// "SELECT name FROM sqlite_master WHERE type='table' AND name='member_preferences';" --json
// into this script. Never paste or commit credentials.
import {readFileSync} from 'node:fs';
let raw;try{raw=JSON.parse(readFileSync(0,'utf8'))}catch{console.error('Expected JSON from wrangler d1 execute --json');process.exit(2)}
const blocks=Array.isArray(raw)?raw:[raw];
const rows=blocks.flatMap(b=>Array.isArray(b.results)?b.results:[]);
if(blocks.some(b=>b.success===false)){console.error('D1 query failed');process.exit(2)}
if(rows.some(r=>r.name==='member_preferences')){console.log('PASS: member_preferences exists in selected D1 database');process.exit(0)}
console.error('NOT READY: member_preferences not found in selected D1 database');process.exit(1);
