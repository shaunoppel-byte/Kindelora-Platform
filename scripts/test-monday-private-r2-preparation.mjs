#!/usr/bin/env node
// Confirm the private R2 payload generator fails closed against actual NO-GO evidence.
// Never use a fake GO or modify founder-approved release evidence in this test.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kindelora-monday-guard-'));
try{
 const target=path.join(temp,'edition.json');
 const result=spawnSync(process.execPath,['scripts/prepare-private-monday-r2.mjs',target],{encoding:'utf8'});
 assert.notEqual(result.status,0,'NO-GO evidence must prevent payload generation');
 assert.match(result.stderr,/BLOCKED: edition and independent release evidence/);
 assert.equal(fs.existsSync(target),false,'No private payload may be generated while release is blocked');
 console.log('PASS: NO-GO blocks edition payload; no file emitted');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
