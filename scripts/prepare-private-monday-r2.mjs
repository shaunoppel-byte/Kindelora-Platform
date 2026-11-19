#!/usr/bin/env node
// Generate a minimal PRIVATE R2 edition JSON only after independently authorized GO.
// Never publish this output under Pages public assets or commit the generated file.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const approved=JSON.parse(fs.readFileSync(path.join(root,'content/motivational-monday-2026-11-16-approved.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(root,'quality/monday-release-evidence.json'),'utf8'));
assert.equal(approved.edition_id,'mm-2026-11-16');
assert.equal(evidence.edition_id,approved.edition_id);
assert.equal(approved.approval.audio.approved,true);
assert.ok(approved.content.paragraphs.length>0);
assert.ok(approved.content.paragraphs.every(p=>typeof p==='string'&&p.length>0));
if(approved.release_decision!=='GO'||evidence.decision!=='GO'||!evidence.reviewer||!evidence.decision_timestamp_utc){
 console.error('BLOCKED: edition and independent release evidence must both record a genuine authorized GO, reviewer and timestamp before generating private R2 payload.');
 process.exit(1);
}
const pending=Object.entries(evidence.gates||{}).filter(([,v])=>v!=='PASS');
if(pending.length){console.error('BLOCKED: release gates not all PASS:',pending.map(([k,v])=>k+'='+v).join(', '));process.exit(1);}
const output={edition_id:approved.edition_id,title:approved.title,publication_date:approved.publication_date,content:{paragraphs:approved.content.paragraphs}};
const target=process.argv[2];
if(!target){console.error('Usage: node scripts/prepare-private-monday-r2.mjs /secure/outside/public/edition.json');process.exit(2);}
const dest=path.resolve(target);
if(dest.startsWith(root+path.sep)||dest===root){console.error('BLOCKED: output must be outside repository and Pages public assets');process.exit(2);}
fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Private edition payload prepared at specified external path; upload to PRIVATE_MONDAY_MEDIA/editions/'+approved.edition_id+'.json only after verifying private R2 binding. Audio must be separately verified and uploaded to matching .mp3 key.');
